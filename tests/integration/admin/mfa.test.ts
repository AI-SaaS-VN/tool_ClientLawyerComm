import { beforeEach, describe, expect, it } from "vitest";

import { GET as listAuditLogs } from "@/app/api/admin/audit-logs/route";
import { POST as enrollMfa } from "@/app/api/auth/mfa/enroll/route";
import { POST as verifyMfa } from "@/app/api/auth/mfa/verify/route";
import { GET as listCases } from "@/app/api/cases/route";
import { prisma } from "@/lib/db";
import { totpCode } from "@/server/auth/mfa";

import {
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  resetDatabase,
  sessionCookieFor,
} from "../helpers";

async function seedAdmin() {
  const { user: admin } = await createVerifiedUser("admin", "admin-mfa@example.com");
  const cookie = await sessionCookieFor(admin.id);
  return { admin, cookie };
}

async function enrollAndVerify(cookie: string): Promise<string> {
  const enroll = await enrollMfa(postJson("/api/auth/mfa/enroll", {}, cookieHeader(cookie)));
  expect(enroll.status).toBe(201);
  const { secret, uri } = await enroll.json();
  expect(secret).toMatch(/^[A-Z2-7]+$/);
  expect(uri).toContain("otpauth://totp/");
  expect(uri).toContain(`secret=${secret}`);
  const verify = await verifyMfa(
    postJson("/api/auth/mfa/verify", { code: totpCode(secret, Date.now()) }, cookieHeader(cookie)),
  );
  expect(verify.status).toBe(200);
  return secret;
}

describe("admin TOTP MFA (REQ-AUTH-09/11, REQ-PM-10)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("an admin without enrolled MFA cannot call admin APIs", async () => {
    const { cookie } = await seedAdmin();
    const res = await listAuditLogs(getRequest("/api/admin/audit-logs", cookieHeader(cookie)));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("mfa_not_enrolled");
  });

  it("only admin accounts can enroll MFA", async () => {
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-mfa@example.com");
    const res = await enrollMfa(
      postJson("/api/auth/mfa/enroll", {}, cookieHeader(await sessionCookieFor(lawyer.id))),
    );
    expect(res.status).toBe(403);
  });

  it("enroll + verify enrolls; a wrong code is denied and audited", async () => {
    const { admin, cookie } = await seedAdmin();
    const enroll = await enrollMfa(postJson("/api/auth/mfa/enroll", {}, cookieHeader(cookie)));
    expect(enroll.status).toBe(201);
    const { secret } = await enroll.json();

    const wrong = await verifyMfa(
      postJson(
        "/api/auth/mfa/verify",
        { code: totpCode(secret, Date.now() + 5 * 60_000) },
        cookieHeader(cookie),
      ),
    );
    expect(wrong.status).toBe(403);
    expect((await wrong.json()).error).toBe("mfa_invalid");
    const denied = await prisma.auditLog.findFirst({
      where: { action: "admin.mfa_verify", result: "denied" },
    });
    expect(denied?.actorId).toBe(admin.id);

    const ok = await verifyMfa(
      postJson("/api/auth/mfa/verify", { code: totpCode(secret, Date.now()) }, cookieHeader(cookie)),
    );
    expect(ok.status).toBe(200);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(after.mfaEnrolledAt).not.toBeNull();

    // Re-enrollment is refused once enrolled.
    const again = await enrollMfa(postJson("/api/auth/mfa/enroll", {}, cookieHeader(cookie)));
    expect(again.status).toBe(409);
  });

  it("an enrolled admin must present a valid TOTP on every admin request", async () => {
    const { cookie } = await seedAdmin();
    const secret = await enrollAndVerify(cookie);

    const missing = await listAuditLogs(getRequest("/api/admin/audit-logs", cookieHeader(cookie)));
    expect(missing.status).toBe(403);
    expect((await missing.json()).error).toBe("mfa_invalid");

    const wrong = await listAuditLogs(
      getRequest("/api/admin/audit-logs", {
        ...cookieHeader(cookie),
        "x-totp-code": totpCode(secret, Date.now() + 5 * 60_000),
      }),
    );
    expect(wrong.status).toBe(403);

    const ok = await listAuditLogs(
      getRequest("/api/admin/audit-logs", {
        ...cookieHeader(cookie),
        "x-totp-code": totpCode(secret, Date.now()),
      }),
    );
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(Array.isArray(body.logs)).toBe(true);
    // Enrollment and verification are in the trail; this read is recorded
    // after its own page is assembled, so check it in the table directly.
    const actions = body.logs.map((log: { action: string }) => log.action);
    expect(actions).toContain("admin.mfa_enroll");
    expect(actions).toContain("admin.mfa_verify");
    const reads = await prisma.auditLog.count({ where: { action: "admin.audit_logs_list" } });
    expect(reads).toBeGreaterThan(0);
  });

  it("supports filtering by action and actor", async () => {
    const { admin, cookie } = await seedAdmin();
    const secret = await enrollAndVerify(cookie);
    const totp = totpCode(secret, Date.now());

    const byAction = await listAuditLogs(
      getRequest("/api/admin/audit-logs?action=admin.mfa_enroll", {
        ...cookieHeader(cookie),
        "x-totp-code": totp,
      }),
    );
    expect(byAction.status).toBe(200);
    const actionLogs = (await byAction.json()).logs;
    expect(actionLogs.length).toBeGreaterThan(0);
    expect(actionLogs.every((log: { action: string }) => log.action === "admin.mfa_enroll")).toBe(
      true,
    );

    const byActor = await listAuditLogs(
      getRequest(`/api/admin/audit-logs?actorId=${admin.id}`, {
        ...cookieHeader(cookie),
        "x-totp-code": totp,
      }),
    );
    const actorLogs = (await byActor.json()).logs;
    expect(actorLogs.every((log: { actorId: string }) => log.actorId === admin.id)).toBe(true);
  });

  it("admin accounts still cannot enter case surfaces (REQ-PM-10)", async () => {
    const { cookie } = await seedAdmin();
    await enrollAndVerify(cookie);
    const res = await listCases(getRequest("/api/cases", cookieHeader(cookie)));
    expect(res.status).toBe(403);
  });
});
