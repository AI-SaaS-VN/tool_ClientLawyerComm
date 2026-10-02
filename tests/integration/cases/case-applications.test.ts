import { beforeEach, describe, expect, it } from "vitest";

import { GET as listApplications, POST as submitApplication } from "@/app/api/case-applications/route";
import { PATCH as decideApplication } from "@/app/api/case-applications/[id]/route";
import { POST as createProfile } from "@/app/api/client-profiles/route";
import { PATCH as updateProfile } from "@/app/api/client-profiles/[id]/route";
import { prisma } from "@/lib/db";

import {
  cookieHeader,
  createVerifiedUser,
  postJson,
  resetDatabase,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function lawyerCookie(email: string) {
  const { user } = await createVerifiedUser("lawyer", email);
  return { user, cookie: await sessionCookieFor(user.id) };
}

describe("client profiles and case applications (REQ-PM-04, REQ-CASE-01)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lets a lawyer maintain only their own client profiles", async () => {
    const { user: lawyer, cookie } = await lawyerCookie("lawyer-p1@example.com");

    const badName = await createProfile(
      postJson("/api/client-profiles", { name: "" }, cookieHeader(cookie)),
    );
    expect(badName.status).toBe(400);

    const created = await createProfile(
      postJson(
        "/api/client-profiles",
        { name: "Fictitious Client Org", note: "fictitious note" },
        cookieHeader(cookie),
      ),
    );
    expect(created.status).toBe(200);
    const profile = (await created.json()).profile;
    expect(profile.name).toBe("Fictitious Client Org");

    const updated = await updateProfile(
      sendJson(
        "PATCH",
        `/api/client-profiles/${profile.id}`,
        { note: "updated note", status: "archived" },
        cookieHeader(cookie),
      ),
      params(profile.id),
    );
    expect(updated.status).toBe(200);
    const stored = await prisma.clientProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(stored.note).toBe("updated note");
    expect(stored.status).toBe("archived");
    expect(stored.lawyerId).toBe(lawyer.id);

    // Another lawyer cannot touch this profile (404, not 403: no existence leak).
    const { cookie: otherCookie } = await lawyerCookie("lawyer-p2@example.com");
    const foreign = await updateProfile(
      sendJson(
        "PATCH",
        `/api/client-profiles/${profile.id}`,
        { note: "takeover" },
        cookieHeader(otherCookie),
      ),
      params(profile.id),
    );
    expect(foreign.status).toBe(404);

    // Non-lawyer roles cannot register profiles at all.
    for (const [role, email] of [
      ["client", "client-p1@example.com"],
      ["coordinator", "coord-p1@example.com"],
      ["admin", "admin-p1@example.com"],
    ] as const) {
      const { user } = await createVerifiedUser(role, email);
      const res = await createProfile(
        postJson(
          "/api/client-profiles",
          { name: "Nope Org" },
          cookieHeader(await sessionCookieFor(user.id)),
        ),
      );
      expect(res.status).toBe(403);
    }
  });

  it("runs the application flow: lawyer submits, coordinator approves into a case", async () => {
    const { user: lawyer, cookie: lawyerCk } = await lawyerCookie("lawyer-app1@example.com");
    const profile = await prisma.clientProfile.create({
      data: { lawyerId: lawyer.id, name: "Applicant Client Org" },
    });

    const submitted = await submitApplication(
      postJson(
        "/api/case-applications",
        { clientProfileId: profile.id, summary: "Fictitious dispute summary" },
        cookieHeader(lawyerCk),
      ),
    );
    expect(submitted.status).toBe(200);
    const application = (await submitted.json()).application;
    expect(application.status).toBe("pending");

    // A lawyer cannot submit against someone else's client profile.
    const { user: otherLawyer } = await createVerifiedUser("lawyer", "lawyer-app2@example.com");
    const stolen = await submitApplication(
      postJson(
        "/api/case-applications",
        { clientProfileId: profile.id, summary: "takeover attempt" },
        cookieHeader(await sessionCookieFor(otherLawyer.id)),
      ),
    );
    expect(stolen.status).toBe(404);

    // Lawyers see only their own applications; coordinators see pending ones.
    const lawyerList = await listApplications(
      sendJson("GET", "/api/case-applications", {}, cookieHeader(lawyerCk)),
    );
    expect(lawyerList.status).toBe(200);
    expect((await lawyerList.json()).applications).toHaveLength(1);

    const { user: coordinator } = await createVerifiedUser("coordinator", "coord-app1@example.com");
    const coordCookie = await sessionCookieFor(coordinator.id);
    const coordList = await listApplications(
      sendJson("GET", "/api/case-applications", {}, cookieHeader(coordCookie)),
    );
    expect(coordList.status).toBe(200);
    expect((await coordList.json()).applications).toHaveLength(1);

    // Lawyers and admins cannot decide.
    for (const [role, email] of [
      ["lawyer", "lawyer-app3@example.com"],
      ["admin", "admin-app1@example.com"],
    ] as const) {
      const { user } = await createVerifiedUser(role, email);
      const denied = await decideApplication(
        sendJson(
          "PATCH",
          `/api/case-applications/${application.id}`,
          { decision: "approved", title: "X" },
          cookieHeader(await sessionCookieFor(user.id)),
        ),
        params(application.id),
      );
      expect(denied.status).toBe(403);
    }

    // Approval still requires a valid case title (REQ-CASE-01).
    const noTitle = await decideApplication(
      sendJson(
        "PATCH",
        `/api/case-applications/${application.id}`,
        { decision: "approved" },
        cookieHeader(coordCookie),
      ),
      params(application.id),
    );
    expect(noTitle.status).toBe(400);

    const approved = await decideApplication(
      sendJson(
        "PATCH",
        `/api/case-applications/${application.id}`,
        { decision: "approved", title: "Approved Case" },
        cookieHeader(coordCookie),
      ),
      params(application.id),
    );
    expect(approved.status).toBe(200);
    const approvedBody = await approved.json();
    expect(approvedBody.application.status).toBe("approved");

    const kase = await prisma.case.findFirstOrThrow({ where: { title: "Approved Case" } });
    // clientOrgName defaults to the client profile's name.
    expect(kase.clientOrgName).toBe("Applicant Client Org");
    expect(kase.createdBy).toBe(coordinator.id);
    const members = await prisma.caseMember.findMany({ where: { caseId: kase.id } });
    const coordMember = members.find((m) => m.userId === coordinator.id)!;
    const lawyerMember = members.find((m) => m.userId === lawyer.id)!;
    expect(coordMember).toMatchObject({
      memberRole: "coordinator",
      canManage: true,
      canReview: true,
    });
    expect(lawyerMember).toMatchObject({
      memberRole: "lawyer",
      canManage: false,
      canReview: false,
    });

    // A decided application cannot be decided again.
    const again = await decideApplication(
      sendJson(
        "PATCH",
        `/api/case-applications/${application.id}`,
        { decision: "rejected" },
        cookieHeader(coordCookie),
      ),
      params(application.id),
    );
    expect(again.status).toBe(409);
  });

  it("supports rejection without creating a case", async () => {
    const { user: lawyer, cookie: lawyerCk } = await lawyerCookie("lawyer-rej@example.com");
    const profile = await prisma.clientProfile.create({
      data: { lawyerId: lawyer.id, name: "Rejected Org" },
    });
    const application = await prisma.caseApplication.create({
      data: { lawyerId: lawyer.id, clientProfileId: profile.id, summary: "fictitious" },
    });

    const { user: coordinator } = await createVerifiedUser("coordinator", "coord-rej@example.com");
    const res = await decideApplication(
      sendJson(
        "PATCH",
        `/api/case-applications/${application.id}`,
        { decision: "rejected" },
        cookieHeader(await sessionCookieFor(coordinator.id)),
      ),
      params(application.id),
    );
    expect(res.status).toBe(200);
    const stored = await prisma.caseApplication.findUniqueOrThrow({
      where: { id: application.id },
    });
    expect(stored.status).toBe("rejected");
    expect(stored.decidedBy).toBe(coordinator.id);
    expect(await prisma.case.count()).toBe(0);
    expect(lawyerCk).toBeTruthy();
  });
});
