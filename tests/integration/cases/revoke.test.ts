import { beforeEach, describe, expect, it } from "vitest";

import { POST as createInvite } from "@/app/api/cases/[id]/invites/route";
import {
  DELETE as revokeMember,
  PATCH as updateMember,
} from "@/app/api/cases/[id]/members/[uid]/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import { prisma } from "@/lib/db";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function memberParams(id: string, uid: string) {
  return { params: Promise.resolve({ id, uid }) };
}

describe("member revocation and duty flags (REQ-PM-05/08, REQ-CASE-02)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("denies new requests immediately after a member is revoked", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Revoke Case");
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-r1@example.com");
    await addMember(kase.id, lawyer.id, "lawyer");
    const lawyerCookie = await sessionCookieFor(lawyer.id);

    const before = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(before.status).toBe(200);

    const revoke = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, lawyer.id),
    );
    expect(revoke.status).toBe(200);

    const member = await prisma.caseMember.findUniqueOrThrow({
      where: { caseId_userId: { caseId: kase.id, userId: lawyer.id } },
    });
    expect(member.status).toBe("revoked");
    expect(member.revokedAt).not.toBeNull();

    const after = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    expect(after.status).toBe(403);
  });

  it("allows only can_manage coordinators to revoke members", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Duty Case");
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-r2@example.com");
    const { user: client } = await createVerifiedUser("client", "client-r2@example.com");
    await addMember(kase.id, lawyer.id, "lawyer");
    await addMember(kase.id, client.id, "client");

    // A lawyer member cannot revoke anyone.
    const lawyerTry = await revokeMember(
      sendJson(
        "DELETE",
        `/api/cases/${kase.id}/members/${client.id}`,
        {},
        cookieHeader(await sessionCookieFor(lawyer.id)),
      ),
      memberParams(kase.id, client.id),
    );
    expect(lawyerTry.status).toBe(403);

    // A coordinator member whose can_manage was turned off cannot revoke.
    const { user: second } = await createVerifiedUser("coordinator", "coord-r2@example.com");
    await addMember(kase.id, second.id, "coordinator", { canManage: false });
    const secondCookie = await sessionCookieFor(second.id);
    const demotedTry = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${client.id}`, {}, cookieHeader(secondCookie)),
      memberParams(kase.id, client.id),
    );
    expect(demotedTry.status).toBe(403);

    // The can_manage coordinator can.
    const ok = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${client.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, client.id),
    );
    expect(ok.status).toBe(200);

    // Revoking an already-revoked member is idempotent; an unknown membership is a 404.
    const missing = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, lawyer.id),
    );
    expect(missing.status).toBe(200);
    const again = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, lawyer.id),
    );
    expect(again.status).toBe(200);
    const ghostId = "00000000-0000-0000-0000-000000000000";
    const ghost = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${ghostId}`, {}, cookieHeader(cookie)),
      memberParams(kase.id, ghostId),
    );
    expect(ghost.status).toBe(404);
  });

  it("supports turning can_manage / can_review off individually, coordinator-only", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Flags Case");
    const { user: second } = await createVerifiedUser("coordinator", "coord-f1@example.com");
    await addMember(kase.id, second.id, "coordinator");
    const secondCookie = await sessionCookieFor(second.id);
    const { user: client } = await createVerifiedUser("client", "client-f1@example.com");
    await addMember(kase.id, client.id, "client");

    // Duty flags default to true for coordinator members, false otherwise.
    const members = await prisma.caseMember.findMany({ where: { caseId: kase.id } });
    const coordRow = members.find((m) => m.userId === second.id)!;
    const clientRow = members.find((m) => m.userId === client.id)!;
    expect(coordRow.canManage).toBe(true);
    expect(coordRow.canReview).toBe(true);
    expect(clientRow.canManage).toBe(false);
    expect(clientRow.canReview).toBe(false);

    // Turn off only can_manage: invite management stops, membership stays.
    const patch = await updateMember(
      sendJson(
        "PATCH",
        `/api/cases/${kase.id}/members/${second.id}`,
        { canManage: false },
        cookieHeader(cookie),
      ),
      memberParams(kase.id, second.id),
    );
    expect(patch.status).toBe(200);
    const after = await prisma.caseMember.findUniqueOrThrow({
      where: { caseId_userId: { caseId: kase.id, userId: second.id } },
    });
    expect(after.canManage).toBe(false);
    expect(after.canReview).toBe(true);

    const invite = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "n@example.com", role: "client" },
        cookieHeader(secondCookie),
      ),
      params(kase.id),
    );
    expect(invite.status).toBe(403);
    const stillMember = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(secondCookie)),
      params(kase.id),
    );
    expect(stillMember.status).toBe(200);

    // Duty flags cannot be raised on non-coordinator members.
    const badPatch = await updateMember(
      sendJson(
        "PATCH",
        `/api/cases/${kase.id}/members/${client.id}`,
        { canManage: true },
        cookieHeader(cookie),
      ),
      memberParams(kase.id, client.id),
    );
    expect(badPatch.status).toBe(400);

    // Only can_manage coordinators may change flags.
    const lawyerPatch = await updateMember(
      sendJson(
        "PATCH",
        `/api/cases/${kase.id}/members/${second.id}`,
        { canReview: false },
        cookieHeader(await sessionCookieFor(client.id)),
      ),
      memberParams(kase.id, second.id),
    );
    expect(lawyerPatch.status).toBe(403);
  });
});
