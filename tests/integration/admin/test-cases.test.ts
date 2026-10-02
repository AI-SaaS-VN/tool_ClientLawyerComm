import { beforeEach, describe, expect, it } from "vitest";

import { POST as createTestCases } from "@/app/api/admin/test-cases/route";
import { POST as enrollMfa } from "@/app/api/auth/mfa/enroll/route";
import { POST as verifyMfa } from "@/app/api/auth/mfa/verify/route";
import { prisma } from "@/lib/db";
import { totpCode } from "@/server/auth/mfa";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  cookieHeader,
  createVerifiedUser,
  extractInviteCode,
  postJson,
  resetDatabase,
  sessionCookieFor,
} from "../helpers";

const TRIANGLE = {
  title: "虚构测试案件 Fictitious Test Case",
  coordinatorEmail: "e2e-coordinator@example.com",
  clientEmail: "e2e-client@example.com",
  lawyerEmail: "e2e-lawyer@example.com",
};

async function seedEnrolledAdmin() {
  const { user: admin } = await createVerifiedUser("admin", "admin-testcase@example.com");
  const cookie = await sessionCookieFor(admin.id);
  const enroll = await enrollMfa(postJson("/api/auth/mfa/enroll", {}, cookieHeader(cookie)));
  const { secret } = await enroll.json();
  await verifyMfa(
    postJson("/api/auth/mfa/verify", { code: totpCode(secret, Date.now()) }, cookieHeader(cookie)),
  );
  return { admin, cookie, secret };
}

function callTestCases(
  cookie: string,
  body: Record<string, unknown>,
  secret?: string,
): ReturnType<typeof createTestCases> {
  return createTestCases(
    postJson("/api/admin/test-cases", body, {
      ...cookieHeader(cookie),
      ...(secret ? { "x-totp-code": totpCode(secret, Date.now()) } : {}),
    }),
  );
}

describe("POST /api/admin/test-cases (REQ-OPS-07)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("an admin without enrolled MFA gets 403 mfa_not_enrolled", async () => {
    const { user: admin } = await createVerifiedUser("admin", "admin-nomfa@example.com");
    const res = await callTestCases(await sessionCookieFor(admin.id), TRIANGLE);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("mfa_not_enrolled");
  });

  it("a non-admin gets 403 even with a TOTP header", async () => {
    const { user: coordinator } = await createVerifiedUser(
      "coordinator",
      "coord-not-admin@example.com",
    );
    const res = await createTestCases(
      postJson("/api/admin/test-cases", TRIANGLE, {
        ...cookieHeader(await sessionCookieFor(coordinator.id)),
        "x-totp-code": "123456",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("a missing triangle email is 400", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const body: Record<string, unknown> = { ...TRIANGLE };
    delete body.clientEmail;
    const res = await callTestCases(cookie, body, secret);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_email");
    expect(await prisma.case.count()).toBe(0);
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("an invalid title is 400", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const res = await callTestCases(cookie, { ...TRIANGLE, title: "two\nlines" }, secret);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_title");
  });

  it("duplicate triangle addresses are 400", async () => {
    const { cookie, secret } = await seedEnrolledAdmin();
    const res = await callTestCases(
      cookie,
      { ...TRIANGLE, lawyerEmail: TRIANGLE.clientEmail },
      secret,
    );
    expect(res.status).toBe(400);
  });

  it("creates the case, mails exactly the three addresses, and keeps the admin out", async () => {
    const { admin, cookie, secret } = await seedEnrolledAdmin();
    const res = await callTestCases(
      cookie,
      {
        ...TRIANGLE,
        coordinatorDisplayName: "Test Coordinator",
        clientDisplayName: "Test Client",
        lawyerDisplayName: "Test Lawyer",
      },
      secret,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe(TRIANGLE.title);
    expect(body.invites.map((i: { role: string }) => i.role).sort()).toEqual([
      "client",
      "coordinator",
      "lawyer",
    ]);

    // Exactly three activation emails, one per entered address, no one else.
    expect(fakeEmailProvider.outbox).toHaveLength(3);
    expect(fakeEmailProvider.outbox.map((entry) => entry.to).sort()).toEqual(
      [TRIANGLE.coordinatorEmail, TRIANGLE.clientEmail, TRIANGLE.lawyerEmail].sort(),
    );
    for (const entry of fakeEmailProvider.outbox) {
      expect(extractInviteCode(entry.text)).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);
    }

    // The case exists with three invites and the administrator is not a member.
    const kase = await prisma.case.findUniqueOrThrow({ where: { id: body.caseId } });
    expect(kase.title).toBe(TRIANGLE.title);
    const invites = await prisma.invite.findMany({ where: { caseId: kase.id } });
    expect(invites).toHaveLength(3);
    const members = await prisma.caseMember.findMany({ where: { caseId: kase.id } });
    expect(members).toHaveLength(0);
    expect(members.some((m) => m.userId === admin.id)).toBe(false);

    // Optional display names land on the pending recipients.
    const coordinatorUser = await prisma.user.findFirstOrThrow({
      where: { displayName: "Test Coordinator" },
    });
    expect(coordinatorUser.globalRole).toBe("coordinator");
    expect(coordinatorUser.status).toBe("pending");

    // Audit: case creation plus one invite.create per recipient, all by the admin.
    const caseCreate = await prisma.auditLog.findFirst({
      where: { action: "case.create", targetId: kase.id },
    });
    expect(caseCreate?.actorId).toBe(admin.id);
    const inviteCreates = await prisma.auditLog.findMany({
      where: { action: "invite.create", caseId: kase.id },
    });
    expect(inviteCreates).toHaveLength(3);
    expect(inviteCreates.every((row) => row.actorId === admin.id)).toBe(true);
  });
});
