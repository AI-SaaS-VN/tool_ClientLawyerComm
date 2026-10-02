import { beforeEach, describe, expect, it } from "vitest";

import { GET as listProfiles } from "@/app/api/client-profiles/route";
import { POST as archiveCase } from "@/app/api/cases/[id]/archive/route";
import { POST as createInvite } from "@/app/api/cases/[id]/invites/route";
import { DELETE as revokeMember } from "@/app/api/cases/[id]/members/[uid]/route";
import { GET as getCase } from "@/app/api/cases/[id]/route";
import { GET as listCases } from "@/app/api/cases/route";
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

describe("cross-case and role isolation (REQ-PM-01/03/04/09/10, REQ-CASE-06)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("denies a lawyer who is in two cases when requesting a third case's API", async () => {
    const first = await seedCaseWithCoordinator("Case One");
    const second = await prisma.case.create({
      data: { title: "Case Two", clientOrgName: "Fictitious Org" },
    });
    const third = await prisma.case.create({
      data: { title: "Case Three", clientOrgName: "Fictitious Org" },
    });
    await addMember(second.id, first.coordinator.id, "coordinator");
    await addMember(third.id, first.coordinator.id, "coordinator");

    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-x1@example.com");
    await addMember(first.kase.id, lawyer.id, "lawyer");
    await addMember(second.id, lawyer.id, "lawyer");
    const lawyerCookie = await sessionCookieFor(lawyer.id);

    const res = await getCase(
      sendJson("GET", `/api/cases/${third.id}`, {}, cookieHeader(lawyerCookie)),
      params(third.id),
    );
    expect(res.status).toBe(403);

    const archiveRes = await archiveCase(
      postJson(`/api/cases/${third.id}/archive`, {}, cookieHeader(lawyerCookie)),
      params(third.id),
    );
    expect(archiveRes.status).toBe(403);

    const revokeRes = await revokeMember(
      sendJson(
        "DELETE",
        `/api/cases/${third.id}/members/${first.coordinator.id}`,
        {},
        cookieHeader(lawyerCookie),
      ),
      memberParams(third.id, first.coordinator.id),
    );
    expect(revokeRes.status).toBe(403);
  });

  it("denies any non-member access to case resources", async () => {
    const { kase, coordinator } = await seedCaseWithCoordinator("Private Case");
    const { user: outsider } = await createVerifiedUser("client", "outsider@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);

    const detail = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(outsiderCookie)),
      params(kase.id),
    );
    expect(detail.status).toBe(403);

    const invite = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "x@example.com", role: "client" },
        cookieHeader(outsiderCookie),
      ),
      params(kase.id),
    );
    expect(invite.status).toBe(403);

    const archive = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(outsiderCookie)),
      params(kase.id),
    );
    expect(archive.status).toBe(403);

    const revoke = await revokeMember(
      sendJson(
        "DELETE",
        `/api/cases/${kase.id}/members/${coordinator.id}`,
        {},
        cookieHeader(outsiderCookie),
      ),
      memberParams(kase.id, coordinator.id),
    );
    expect(revoke.status).toBe(403);

    const anon = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}),
      params(kase.id),
    );
    expect(anon.status).toBe(401);
  });

  it("blocks admin accounts from every case API (REQ-PM-10)", async () => {
    const { kase, coordinator } = await seedCaseWithCoordinator("Admin-Proof Case");
    const { user: admin } = await createVerifiedUser("admin", "admin-x@example.com");
    const adminCookie = await sessionCookieFor(admin.id);

    const list = await listCases(
      sendJson("GET", "/api/cases", {}, cookieHeader(adminCookie)),
    );
    expect(list.status).toBe(403);

    const detail = await getCase(
      sendJson("GET", `/api/cases/${kase.id}`, {}, cookieHeader(adminCookie)),
      params(kase.id),
    );
    expect(detail.status).toBe(403);

    const invite = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "x@example.com", role: "client" },
        cookieHeader(adminCookie),
      ),
      params(kase.id),
    );
    expect(invite.status).toBe(403);

    const archive = await archiveCase(
      postJson(`/api/cases/${kase.id}/archive`, {}, cookieHeader(adminCookie)),
      params(kase.id),
    );
    expect(archive.status).toBe(403);

    const revoke = await revokeMember(
      sendJson(
        "DELETE",
        `/api/cases/${kase.id}/members/${coordinator.id}`,
        {},
        cookieHeader(adminCookie),
      ),
      memberParams(kase.id, coordinator.id),
    );
    expect(revoke.status).toBe(403);
  });

  it("never lets a lawyer list client profiles platform-wide (REQ-PM-04)", async () => {
    const { user: lawyerA } = await createVerifiedUser("lawyer", "lawyer-a@example.com");
    const { user: lawyerB } = await createVerifiedUser("lawyer", "lawyer-b@example.com");
    await prisma.clientProfile.create({
      data: { lawyerId: lawyerA.id, name: "Client Org of A" },
    });
    await prisma.clientProfile.create({
      data: { lawyerId: lawyerB.id, name: "Client Org of B" },
    });

    const res = await listProfiles(
      sendJson("GET", "/api/client-profiles", {}, cookieHeader(await sessionCookieFor(lawyerA.id))),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0].name).toBe("Client Org of A");
    expect(JSON.stringify(body)).not.toContain("Client Org of B");

    const { user: client } = await createVerifiedUser("client", "client-x@example.com");
    const denied = await listProfiles(
      sendJson("GET", "/api/client-profiles", {}, cookieHeader(await sessionCookieFor(client.id))),
    );
    expect(denied.status).toBe(403);
  });

  it("requires the notification email on invite and never leaks it (400 if missing)", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator("Invite Case");

    const missing = await createInvite(
      postJson(`/api/cases/${kase.id}/invites`, { role: "client" }, cookieHeader(cookie)),
      params(kase.id),
    );
    expect(missing.status).toBe(400);

    // No membership exists before the notified person accepts (REQ-CASE-02).
    const ok = await createInvite(
      postJson(
        `/api/cases/${kase.id}/invites`,
        { email: "pending-member@example.com", role: "lawyer" },
        cookieHeader(cookie),
      ),
      params(kase.id),
    );
    expect(ok.status).toBe(200);
    expect(
      await prisma.caseMember.count({ where: { caseId: kase.id, memberRole: "lawyer" } }),
    ).toBe(0);
    expect(JSON.stringify(await ok.json())).not.toContain("pending-member@example.com");
  });
});
