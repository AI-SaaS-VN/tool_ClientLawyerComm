import { beforeEach, describe, expect, it } from "vitest";

import { POST as acceptInviteRoute } from "@/app/api/invites/accept/route";
import { POST as archiveCase } from "@/app/api/cases/[id]/archive/route";
import { POST as createInvite } from "@/app/api/cases/[id]/invites/route";
import { DELETE as revokeMember } from "@/app/api/cases/[id]/members/[uid]/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import { prisma } from "@/lib/db";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  extractInviteCode,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("archive entry and read-only semantics (REQ-CASE-05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lets a can_manage coordinator archive; the case becomes read-only", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Archive Case");
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-a1@example.com");
    await addMember(kase.id, lawyer.id, "lawyer");

    // A lawyer member cannot archive.
    const lawyerTry = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(await sessionCookieFor(lawyer.id))),
      params(kase.id),
    );
    expect(lawyerTry.status).toBe(403);

    const res = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(res.status).toBe(200);
    expect((await prisma.case.findUniqueOrThrow({ where: { id: kase.id } })).status).toBe(
      "archived",
    );

    // Archiving again is rejected.
    const twice = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(twice.status).toBe(409);

    // Members can still read the archived case.
    const detail = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(await sessionCookieFor(lawyer.id))),
      params(kase.id),
    );
    expect(detail.status).toBe(200);
    expect((await detail.json()).case.status).toBe("archived");

    // But no new invites or membership changes.
    const invite = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "late@example.com", role: "client" },
        cookieHeader(cookie),
      ),
      params(kase.id),
    );
    expect(invite.status).toBe(409);
    const revoke = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${lawyer.id}`, {}, cookieHeader(cookie)),
      { params: Promise.resolve({ id: kase.id, uid: lawyer.id }) },
    );
    expect(revoke.status).toBe(409);
  });

  it("rejects accepting an invitation into an archived case", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Archive Accept Case");
    await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "late-joiner@example.com", role: "client" },
        cookieHeader(cookie),
      ),
      params(kase.id),
    );
    const code = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(cookie)),
      params(kase.id),
    );

    const { user: client } = await createVerifiedUser("client", "late-joiner@example.com");
    const res = await acceptInviteRoute(
      postJson("/api/invites/accept", { code }, cookieHeader(await sessionCookieFor(client.id))),
    );
    expect(res.status).toBe(409);
    expect(
      await prisma.caseMember.count({ where: { caseId: kase.id, userId: client.id } }),
    ).toBe(0);
  });
});
