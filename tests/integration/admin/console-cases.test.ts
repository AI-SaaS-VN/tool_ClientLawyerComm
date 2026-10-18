import { beforeEach, describe, expect, it } from "vitest";

import { GET as listCases, POST as createCase } from "@/app/api/admin/cases/route";
import { POST as addInvite } from "@/app/api/admin/cases/[id]/invites/route";
import { DELETE as revokeMemberRoute } from "@/app/api/admin/cases/[id]/members/[uid]/route";
import { POST as activateRoute } from "@/app/api/invites/activate/route";
import { GET as listMessagesRoute } from "@/app/api/cases/[id]/messages/route";
import { POST as enrollMfa } from "@/app/api/auth/mfa/enroll/route";
import { POST as verifyMfa } from "@/app/api/auth/mfa/verify/route";
import { prisma } from "@/lib/db";
import { totpCode } from "@/server/auth/mfa";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  cookieHeader,
  createVerifiedUser,
  extractInviteCode,
  getRequest,
  postJson,
  resetDatabase,
  sendJson,
  sessionCookieFor,
} from "../helpers";

const PARTICIPANTS = [
  { email: "console-coord@example.com", role: "coordinator", displayName: "Console Coord" },
  { email: "console-client@example.com", role: "client", displayName: "Console Client" },
  { email: "console-lawyer@example.com", role: "lawyer" },
];

const CREATE_BODY = {
  title: "虚构案件 Console Case",
  clientOrgName: "Fictitious Client Org",
  participants: PARTICIPANTS,
};

async function seedEnrolledAdmin() {
  const { user: admin } = await createVerifiedUser("admin", "admin-console@example.com");
  const cookie = await sessionCookieFor(admin.id);
  const enroll = await enrollMfa(postJson("/api/auth/mfa/enroll", {}, cookieHeader(cookie)));
  const { secret } = await enroll.json();
  await verifyMfa(
    postJson("/api/auth/mfa/verify", { code: totpCode(secret, Date.now()) }, cookieHeader(cookie)),
  );
  return { admin, cookie, secret };
}

function mfaHeaders(cookie: string, secret: string): Record<string, string> {
  return { ...cookieHeader(cookie), "x-totp-code": totpCode(secret, Date.now()) };
}

function callList(cookie: string, secret?: string) {
  return listCases(
    getRequest("/api/admin/cases", {
      ...cookieHeader(cookie),
      ...(secret ? { "x-totp-code": totpCode(secret, Date.now()) } : {}),
    }),
  );
}

function callCreate(cookie: string, secret: string, body: Record<string, unknown>) {
  return createCase(postJson("/api/admin/cases", body, mfaHeaders(cookie, secret)));
}

function callAddInvite(cookie: string, secret: string, caseId: string, body: Record<string, unknown>) {
  return addInvite(postJson(`/api/admin/cases/${caseId}/invites`, body, mfaHeaders(cookie, secret)), {
    params: Promise.resolve({ id: caseId }),
  });
}

function callRevoke(cookie: string, secret: string, caseId: string, uid: string) {
  return revokeMemberRoute(
    sendJson("DELETE", `/api/admin/cases/${caseId}/members/${uid}`, {}, mfaHeaders(cookie, secret)),
    { params: Promise.resolve({ id: caseId, uid }) },
  );
}

async function activate(email: string, code: string) {
  return activateRoute(postJson("/api/invites/activate", { email, code }));
}

describe("admin console cases (REQ-ADM-01~05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("an admin without enrolled MFA gets 403 mfa_not_enrolled on every console route", async () => {
    const { user: admin } = await createVerifiedUser("admin", "admin-nomfa2@example.com");
    const cookie = await sessionCookieFor(admin.id);
    const list = await callList(cookie);
    expect(list.status).toBe(403);
    expect((await list.json()).error).toBe("mfa_not_enrolled");
    const create = await createCase(
      postJson("/api/admin/cases", CREATE_BODY, cookieHeader(cookie)),
    );
    expect(create.status).toBe(403);
  });

  it("a non-admin gets 403 even with a TOTP header", async () => {
    const { user: coordinator } = await createVerifiedUser(
      "coordinator",
      "coord-not-admin2@example.com",
    );
    const cookie = await sessionCookieFor(coordinator.id);
    const res = await callList(cookie, "unused");
    expect(res.status).toBe(403);
    const create = await createCase(
      postJson("/api/admin/cases", CREATE_BODY, {
        ...cookieHeader(cookie),
        "x-totp-code": "123456",
      }),
    );
    expect(create.status).toBe(403);
  });

  it("creating without one of each role is 400 and sends nothing", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const res = await callCreate(cookie, secret, {
      ...CREATE_BODY,
      participants: PARTICIPANTS.filter((p) => p.role !== "lawyer"),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_participants");
    expect(await prisma.case.count()).toBe(0);
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("duplicate participant addresses are 400", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const res = await callCreate(cookie, secret, {
      ...CREATE_BODY,
      participants: [...PARTICIPANTS, { email: "Console-Client@example.com", role: "client" }],
    });
    expect(res.status).toBe(400);
    expect(await prisma.case.count()).toBe(0);
  });

  it("an invalid title or missing client organization is 400", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const badTitle = await callCreate(cookie, secret, { ...CREATE_BODY, title: "two\nlines" });
    expect(badTitle.status).toBe(400);
    expect((await badTitle.json()).error).toBe("invalid_title");
    const noOrg = await callCreate(cookie, secret, { ...CREATE_BODY, clientOrgName: "" });
    expect(noOrg.status).toBe(400);
    expect((await noOrg.json()).error).toBe("invalid_client_org");
    expect(await prisma.case.count()).toBe(0);
  });

  it("an invite for an existing account with a different global role is rejected at creation (REQ-ADM-05)", async () => {
    await createVerifiedUser("lawyer", "console-client@example.com");
    const { cookie, secret } = await seedEnrolledAdmin();
    const res = await callCreate(cookie, secret, CREATE_BODY);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("role_mismatch");
    expect(await prisma.case.count()).toBe(0);
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("creates the case, mails exactly the entered addresses, and keeps the admin out", async () => {
    const { admin, cookie, secret } = await seedEnrolledAdmin();
    const res = await callCreate(cookie, secret, CREATE_BODY);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe(CREATE_BODY.title);

    expect(fakeEmailProvider.outbox).toHaveLength(3);
    expect(fakeEmailProvider.outbox.map((entry) => entry.to).sort()).toEqual(
      PARTICIPANTS.map((p) => p.email).sort(),
    );

    const members = await prisma.caseMember.findMany({ where: { caseId: body.caseId } });
    expect(members).toHaveLength(0);
    expect(members.some((m) => m.userId === admin.id)).toBe(false);

    const caseCreate = await prisma.auditLog.findFirst({
      where: { action: "case.create", targetId: body.caseId },
    });
    expect(caseCreate?.actorId).toBe(admin.id);
    expect((caseCreate?.metaJson as { origin?: string })?.origin).toBe("admin_console");
    const inviteCreates = await prisma.auditLog.findMany({
      where: { action: "invite.create", caseId: body.caseId },
    });
    expect(inviteCreates).toHaveLength(3);
    expect(inviteCreates.every((row) => row.actorId === admin.id)).toBe(true);
  });

  it("lists metadata and the roster only, with pending/active statuses and no case content", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const created = await (await callCreate(cookie, secret, CREATE_BODY)).json();

    // The client activates; the lawyer invite stays pending.
    const clientMail = fakeEmailProvider.outbox.find((e) => e.to === "console-client@example.com")!;
    const act = await activate("console-client@example.com", extractInviteCode(clientMail.text));
    expect(act.status).toBe(200);

    const res = await callList(cookie, secret);
    expect(res.status).toBe(200);
    const { cases } = await res.json();
    expect(cases).toHaveLength(1);
    const view = cases[0];
    expect(view.id).toBe(created.caseId);
    expect(view.title).toBe(CREATE_BODY.title);
    expect(view.clientOrgName).toBe(CREATE_BODY.clientOrgName);
    expect(view.status).toBe("active");

    // Metadata-only shape: no message/file content keys anywhere.
    expect(Object.keys(view).sort()).toEqual([
      "clientOrgName",
      "createdAt",
      "id",
      "members",
      "status",
      "title",
    ]);

    const byStatus = Object.fromEntries(view.members.map((m: { role: string; status: string }) => [m.role, m]));
    expect(byStatus.client.status).toBe("active");
    expect(byStatus.client.displayName).toBe("Console Client");
    expect(byStatus.lawyer.status).toBe("pending");
    expect(byStatus.lawyer.email).toBe("console-lawyer@example.com");
    expect(byStatus.coordinator.status).toBe("pending");
    // The administrator never appears on a roster (REQ-PM-10).
    expect(view.members.every((m: { role: string }) => m.role !== "admin")).toBe(true);
  });

  it("adds a participant to an existing case with exactly one email, and rejects a role mismatch", async () => {
    const { admin, cookie, secret } = await seedEnrolledAdmin();
    const created = await (await callCreate(cookie, secret, CREATE_BODY)).json();
    fakeEmailProvider.reset();
    const invitesBefore = await prisma.auditLog.count({
      where: { action: "invite.create", caseId: created.caseId, actorId: admin.id },
    });

    const res = await callAddInvite(cookie, secret, created.caseId, {
      email: "console-lawyer2@example.com",
      role: "lawyer",
      displayName: "Second Lawyer",
    });
    expect(res.status).toBe(201);
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.to).toBe("console-lawyer2@example.com");
    const inviteCreates = await prisma.auditLog.findMany({
      where: { action: "invite.create", caseId: created.caseId, actorId: admin.id },
    });
    expect(inviteCreates).toHaveLength(invitesBefore + 1);

    // Role mismatch with an existing account is rejected at creation time.
    await createVerifiedUser("client", "console-lawyer3@example.com");
    const mismatch = await callAddInvite(cookie, secret, created.caseId, {
      email: "console-lawyer3@example.com",
      role: "lawyer",
    });
    expect(mismatch.status).toBe(409);
    expect((await mismatch.json()).error).toBe("role_mismatch");

    // An admin role can never be invited.
    const badRole = await callAddInvite(cookie, secret, created.caseId, {
      email: "x@example.com",
      role: "admin",
    });
    expect(badRole.status).toBe(400);

    // Unknown case is 404.
    const missing = await callAddInvite(cookie, secret, "missing-case-id", {
      email: "y@example.com",
      role: "lawyer",
    });
    expect(missing.status).toBe(404);
  });

  it("revokes a member with immediate effect and an audit row (REQ-PM-08)", async () => {
    const { admin, cookie, secret } = await seedEnrolledAdmin();
    const created = await (await callCreate(cookie, secret, CREATE_BODY)).json();
    const clientMail = fakeEmailProvider.outbox.find((e) => e.to === "console-client@example.com")!;
    const act = await activate("console-client@example.com", extractInviteCode(clientMail.text));
    expect(act.status).toBe(200);
    const actBody = await act.json();
    const clientUser = await prisma.user.findFirstOrThrow({
      where: { displayName: "Console Client" },
    });
    expect(actBody.caseId).toBe(created.caseId);

    const res = await callRevoke(cookie, secret, created.caseId, clientUser.id);
    expect(res.status).toBe(200);
    const member = await prisma.caseMember.findUniqueOrThrow({
      where: { caseId_userId: { caseId: created.caseId, userId: clientUser.id } },
    });
    expect(member.status).toBe("revoked");
    const revokeAudit = await prisma.auditLog.findFirst({
      where: { action: "member.revoke", caseId: created.caseId },
    });
    expect(revokeAudit?.actorId).toBe(admin.id);

    // The revocation denies the very next request (REQ-PM-08).
    const clientCookie = await sessionCookieFor(clientUser.id);
    const denied = await listMessagesRoute(
      getRequest(`/api/cases/${created.caseId}/messages`, cookieHeader(clientCookie)),
      { params: Promise.resolve({ id: created.caseId }) },
    );
    expect(denied.status).toBe(403);

    // Revoking a non-member is 404.
    const { user: outsider } = await createVerifiedUser("client", "outsider@example.com");
    const missing = await callRevoke(cookie, secret, created.caseId, outsider.id);
    expect(missing.status).toBe(404);
  });
});
