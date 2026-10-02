import { beforeEach, describe, expect, it } from "vitest";

import { POST as createCase } from "@/app/api/cases/route";
import { prisma } from "@/lib/db";

import {
  cookieHeader,
  createVerifiedUser,
  postJson,
  resetDatabase,
  sessionCookieFor,
} from "../helpers";

async function coordinatorCookie(email = "coord-title@example.com") {
  const { user } = await createVerifiedUser("coordinator", email);
  return { user, cookie: await sessionCookieFor(user.id) };
}

describe("POST /api/cases title validation (REQ-CASE-01)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("rejects an empty, missing, over-80, or line-broken title", async () => {
    const { cookie } = await coordinatorCookie();
    const body = { clientOrgName: "Fictitious Org" };

    for (const title of ["", "x".repeat(81), "line1\nline2", "line1\rline2"]) {
      const res = await createCase(
        postJson("/api/cases", { ...body, title }, cookieHeader(cookie)),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("invalid_title");
    }

    const missing = await createCase(
      postJson("/api/cases", body, cookieHeader(cookie)),
    );
    expect(missing.status).toBe(400);

    expect(await prisma.case.count()).toBe(0);
  });

  it("accepts titles of exactly 1 and 80 characters", async () => {
    const { cookie } = await coordinatorCookie();

    for (const title of ["甲", "y".repeat(80)]) {
      const res = await createCase(
        postJson(
          "/api/cases",
          { title, clientOrgName: "Fictitious Org" },
          cookieHeader(cookie),
        ),
      );
      expect(res.status).toBe(200);
    }
    expect(await prisma.case.count()).toBe(2);
  });

  it("requires clientOrgName and stores optional refNo/alias", async () => {
    const { user, cookie } = await coordinatorCookie();

    const noOrg = await createCase(
      postJson("/api/cases", { title: "Case Without Org" }, cookieHeader(cookie)),
    );
    expect(noOrg.status).toBe(400);
    expect((await noOrg.json()).error).toBe("invalid_client_org");

    const res = await createCase(
      postJson(
        "/api/cases",
        {
          title: "Full Case",
          clientOrgName: "Fictitious Org",
          refNo: "REF-2026-001",
          alias: "DG-Test",
        },
        cookieHeader(cookie),
      ),
    );
    expect(res.status).toBe(200);
    const kase = await prisma.case.findFirstOrThrow({
      where: { title: "Full Case" },
    });
    expect(kase.refNo).toBe("REF-2026-001");
    expect(kase.alias).toBe("DG-Test");
    expect(kase.createdBy).toBe(user.id);
    expect(kase.status).toBe("active");
  });

  it("makes the creator a coordinator member with both duty flags on", async () => {
    const { user, cookie } = await coordinatorCookie();
    const res = await createCase(
      postJson(
        "/api/cases",
        { title: "Membership Case", clientOrgName: "Fictitious Org" },
        cookieHeader(cookie),
      ),
    );
    expect(res.status).toBe(200);

    const member = await prisma.caseMember.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(member.memberRole).toBe("coordinator");
    expect(member.canManage).toBe(true);
    expect(member.canReview).toBe(true);
  });

  it("rejects creation by lawyer, client, admin, and anonymous users", async () => {
    for (const [role, email] of [
      ["lawyer", "lawyer-create@example.com"],
      ["client", "client-create@example.com"],
      ["admin", "admin-create@example.com"],
    ] as const) {
      const { user } = await createVerifiedUser(role, email);
      const res = await createCase(
        postJson(
          "/api/cases",
          { title: "Nope", clientOrgName: "Fictitious Org" },
          cookieHeader(await sessionCookieFor(user.id)),
        ),
      );
      expect(res.status).toBe(403);
    }

    const anon = await createCase(
      postJson("/api/cases", { title: "Anon", clientOrgName: "Fictitious Org" }),
    );
    expect(anon.status).toBe(401);
    expect(await prisma.case.count()).toBe(0);
  });
});
