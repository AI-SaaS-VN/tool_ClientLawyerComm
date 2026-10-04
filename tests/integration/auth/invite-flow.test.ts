import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as createInvite } from "@/app/api/cases/[id]/invites/route";
import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as acceptInviteRoute } from "@/app/api/invites/accept/route";
import { POST as activateRoute } from "@/app/api/invites/activate/route";
import { DELETE as revokeInviteRoute } from "@/app/api/invites/[id]/route";
import { POST as resendInviteRoute } from "@/app/api/invites/[id]/resend/route";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  cookieHeader,
  createVerifiedUser,
  extractInviteCode,
  extractOtp,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
  sessionCookieFrom,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function inviteByCoordinator(
  cookie: string,
  caseId: string,
  email: string,
  role: string,
) {
  const res = await createInvite(
    postJson(`/api/cases/${caseId}/invites`, { email, role }, cookieHeader(cookie)),
    params(caseId),
  );
  return res;
}

async function activate(email: string, code: string) {
  return activateRoute(postJson("/api/invites/activate", { email, code }));
}

describe("invitation + OTP flow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("activates in one step, and only the invited email can use the code", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();
    const consoleSpy = vi.spyOn(console, "log");
    const consoleErrSpy = vi.spyOn(console, "error");

    const res = await inviteByCoordinator(cookie, kase.id, "client1@example.com", "client");
    expect(res.status).toBe(200);

    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.to).toBe("client1@example.com");
    const mail = fakeEmailProvider.outbox[0]!;
    expect(mail.subject).toContain("案件邀請");
    expect(mail.text).toContain("邀請碼");
    expect(mail.text).toContain("/invite");
    expect(mail.text).toContain("7 天內有效");
    const code = extractInviteCode(mail.text);

    const bodyText = JSON.stringify(await res.json());
    expect(bodyText).not.toContain("client1@example.com");
    expect(bodyText).not.toContain(code.replace("-", ""));

    const wrong = await activate("other@example.com", code);
    expect(wrong.status).toBe(403);
    expect(await prisma.caseMember.count({ where: { caseId: kase.id, memberRole: "client" } })).toBe(0);
    expect(await prisma.user.count({ where: { globalRole: "client" } })).toBe(0);

    const verifyRes = await activate("client1@example.com", code);
    expect(verifyRes.status).toBe(200);
    const body = await verifyRes.json();
    expect(body.role).toBe("client");
    expect(verifyRes.headers.getSetCookie().some((c) => c.startsWith(`${SESSION_COOKIE}=`))).toBe(true);
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(await prisma.otpChallenge.count()).toBe(0);

    const member = await prisma.caseMember.findFirstOrThrow({
      where: { caseId: kase.id, user: { globalRole: "client" } },
      include: { user: true },
    });
    expect(member.memberRole).toBe("client");
    expect(member.user.status).toBe("active");
    expect(await prisma.caseMember.count({ where: { userId: member.userId } })).toBe(1);

    const logged = [...consoleSpy.mock.calls, ...consoleErrSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain(code);
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
  });

  it("lets a logged-in lawyer accept a second case on the same account", async () => {
    const first = await seedCaseWithCoordinator();
    const res1 = await inviteByCoordinator(first.cookie, first.kase.id, "lawyer1@example.com", "lawyer");
    const code1 = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);
    expect(res1.status).toBe(200);
    const verifyRes = await activate("lawyer1@example.com", code1);
    expect(verifyRes.status).toBe(200);
    const lawyerCookie = sessionCookieFrom(verifyRes.headers.getSetCookie());

    const usersBefore = await prisma.user.count();

    // A second case, managed by the same coordinator, invites a lawyer again.
    const case2 = await prisma.case.create({
      data: { title: "Second Case", clientOrgName: "Fictitious Org Two" },
    });
    await prisma.caseMember.create({
      data: {
        caseId: case2.id,
        userId: first.coordinator.id,
        memberRole: "coordinator",
        canManage: true,
        canReview: true,
      },
    });
    const res2 = await inviteByCoordinator(first.cookie, case2.id, "lawyer1@example.com", "lawyer");
    expect(res2.status).toBe(200);
    const code2 = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    const acceptRes = await acceptInviteRoute(
      postJson("/api/invites/accept", { code: code2 }, cookieHeader(lawyerCookie)),
    );
    expect(acceptRes.status).toBe(200);

    // No second account; one more membership only.
    expect(await prisma.user.count()).toBe(usersBefore);
    const lawyer = await prisma.user.findFirstOrThrow({
      where: { globalRole: "lawyer" },
    });
    const memberships = await prisma.caseMember.findMany({
      where: { userId: lawyer.id },
    });
    expect(memberships).toHaveLength(2);
    expect(new Set(memberships.map((m) => m.caseId))).toEqual(
      new Set([first.kase.id, case2.id]),
    );
    expect(memberships.every((m) => m.memberRole === "lawyer")).toBe(true);
  });

  it("refuses acceptance when the account role does not match the invite role", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();
    await inviteByCoordinator(cookie, kase.id, "client2@example.com", "lawyer");
    const code = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    const { user: client } = await createVerifiedUser("client", "client2@example.com");
    const clientCookie = await sessionCookieFor(client.id);
    const res = await acceptInviteRoute(
      postJson("/api/invites/accept", { code }, cookieHeader(clientCookie)),
    );
    expect(res.status).toBe(403);
    expect(await prisma.caseMember.count({ where: { caseId: kase.id, memberRole: "lawyer" } })).toBe(0);

    const verifyRes = await activate("client2@example.com", code);
    expect(verifyRes.status).toBe(403);
    expect(await prisma.caseMember.count({ where: { caseId: kase.id, userId: client.id } })).toBe(0);
    const invite = await prisma.invite.findFirstOrThrow({ where: { caseId: kase.id, role: "lawyer" } });
    expect(invite.usedAt).toBeNull();
  });

  it("rejects an expired unused code, and the same email plus code signs in again", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();

    const expiredRes = await inviteByCoordinator(cookie, kase.id, "exp@example.com", "client");
    const expiredInviteId = (await expiredRes.json()).invite.id as string;
    await prisma.invite.update({
      where: { id: expiredInviteId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expiredCode = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);
    const reqExpired = await activate("exp@example.com", expiredCode);
    expect(reqExpired.status).toBe(410);

    const okRes = await inviteByCoordinator(cookie, kase.id, "ok@example.com", "client");
    expect(okRes.status).toBe(200);
    const okCode = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);
    const verifyRes = await activate("ok@example.com", okCode);
    expect(verifyRes.status).toBe(200);

    const membersBefore = await prisma.caseMember.count({
      where: { caseId: kase.id, memberRole: "client" },
    });
    const replayReq = await activate("ok@example.com", okCode);
    expect(replayReq.status).toBe(200);
    expect((await replayReq.json()).caseId).toBe(kase.id);
    expect(
      await prisma.caseMember.count({ where: { caseId: kase.id, memberRole: "client" } }),
    ).toBe(membersBefore);
    const other = await prisma.user.findFirstOrThrow({ where: { globalRole: "client" } });
    const replayAccept = await acceptInviteRoute(
      postJson("/api/invites/accept", { code: okCode }, cookieHeader(await sessionCookieFor(other.id))),
    );
    expect(replayAccept.status).toBe(410);
  });

  it("locks after 5 wrong OTP attempts and rejects even the correct code while locked", async () => {
    await createVerifiedUser("client", "client5@example.com");
    const reqRes = await requestOtp(postJson("/api/auth/otp/request", { email: "client5@example.com" }));
    expect(reqRes.status).toBe(200);
    const otp = extractOtp(fakeEmailProvider.outbox.at(-1)!.text);

    for (let i = 0; i < 5; i++) {
      const res = await verifyOtp(
        postJson("/api/auth/otp/verify", { email: "client5@example.com", code: "000000" === otp ? "111111" : "000000" }),
      );
      expect(res.status).toBe(401);
    }
    const locked = await verifyOtp(
      postJson("/api/auth/otp/verify", { email: "client5@example.com", code: otp }),
    );
    expect(locked.status).toBe(429);
  });

  it("enforces the 60-second interval and the 10-per-day cap per channel", async () => {
    await createVerifiedUser("client", "client6@example.com");
    const first = await requestOtp(postJson("/api/auth/otp/request", { email: "client6@example.com" }));
    expect(first.status).toBe(200);
    const second = await requestOtp(postJson("/api/auth/otp/request", { email: "client6@example.com" }));
    expect(second.status).toBe(429);

    // Simulate 10 sends earlier today (all outside the 60s interval).
    const channel = await prisma.contactChannel.findFirstOrThrow();
    await prisma.otpChallenge.deleteMany();
    await prisma.otpChallenge.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        channelId: channel.id,
        codeHash: "x".repeat(64),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(Date.now() - (i + 2) * 61_000),
      })),
    });
    const capped = await requestOtp(postJson("/api/auth/otp/request", { email: "client6@example.com" }));
    expect(capped.status).toBe(429);

    // Unregistered addresses always get the neutral 200 and no email.
    fakeEmailProvider.reset();
    const neutral = await requestOtp(postJson("/api/auth/otp/request", { email: "ghost@example.com" }));
    expect(neutral.status).toBe(200);
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("revokes immediately; resend invalidates the old code and mails only the original address", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();
    const res = await inviteByCoordinator(cookie, kase.id, "orig@example.com", "client");
    const inviteId = (await res.json()).invite.id as string;
    const oldCode = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    const del = await revokeInviteRoute(
      postJson(`/api/invites/${inviteId}`, {}, cookieHeader(cookie)),
      params(inviteId),
    );
    expect(del.status).toBe(200);
    const afterRevoke = await activate("orig@example.com", oldCode);
    expect(afterRevoke.status).toBe(410);

    // Resend of a revoked invite is refused; make a fresh invite to resend.
    const res2 = await inviteByCoordinator(cookie, kase.id, "orig2@example.com", "client");
    const invite2Id = (await res2.json()).invite.id as string;
    const oldCode2 = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    const resend = await resendInviteRoute(
      postJson(`/api/invites/${invite2Id}/resend`, {}, cookieHeader(cookie)),
      params(invite2Id),
    );
    expect(resend.status).toBe(200);
    const resendMail = fakeEmailProvider.outbox.at(-1)!;
    // Only the original notification address receives the new code.
    expect(resendMail.to).toBe("orig2@example.com");
    const newCode = extractInviteCode(resendMail.text);
    expect(newCode).not.toBe(oldCode2);

    const oldCodeReq = await activate("orig2@example.com", oldCode2);
    expect(oldCodeReq.status).toBe(400);

    const verifyRes = await activate("orig2@example.com", newCode);
    expect(verifyRes.status).toBe(200);
    expect((await verifyRes.json()).role).toBe("client");
  });

  it("refuses invite management to non-managers and never creates admin accounts", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();

    // role=admin is rejected at creation (REQ-AUTH-11).
    const adminTry = await inviteByCoordinator(cookie, kase.id, "a@example.com", "admin");
    expect(adminTry.status).toBe(400);

    // A plain member (client) cannot create, revoke, or resend invites.
    const { user: client } = await createVerifiedUser("client", "client8@example.com");
    const clientCookie = await sessionCookieFor(client.id);
    const forbidden = await inviteByCoordinator(clientCookie, kase.id, "b@example.com", "client");
    expect(forbidden.status).toBe(403);

    const ok = await inviteByCoordinator(cookie, kase.id, "c@example.com", "client");
    const inviteId = (await ok.json()).invite.id as string;
    const forbidRevoke = await revokeInviteRoute(
      postJson(`/api/invites/${inviteId}`, {}, cookieHeader(clientCookie)),
      params(inviteId),
    );
    expect(forbidRevoke.status).toBe(403);
    const forbidResend = await resendInviteRoute(
      postJson(`/api/invites/${inviteId}/resend`, {}, cookieHeader(clientCookie)),
      params(inviteId),
    );
    expect(forbidResend.status).toBe(403);

    expect(await prisma.user.count({ where: { globalRole: "admin" } })).toBe(0);
  });

  it("sets the session cookie without Secure only when SESSION_COOKIE_SECURE=false", async () => {
    await createVerifiedUser("client", "client9a@example.com");
    await createVerifiedUser("client", "client9b@example.com");

    async function loginOnce(email: string) {
      await requestOtp(postJson("/api/auth/otp/request", { email }));
      const otp = extractOtp(fakeEmailProvider.outbox.at(-1)!.text);
      return verifyOtp(postJson("/api/auth/otp/verify", { email, code: otp }));
    }

    const prev = process.env.SESSION_COOKIE_SECURE;
    try {
      process.env.SESSION_COOKIE_SECURE = "false";
      const insecureRes = await loginOnce("client9a@example.com");
      const insecureCookie = insecureRes.headers
        .getSetCookie()
        .find((c) => c.startsWith(`${SESSION_COOKIE}=`))!;
      expect(insecureCookie).not.toMatch(/;\s*Secure/i);
      expect(insecureCookie).toMatch(/HttpOnly/i);
      expect(insecureCookie).toMatch(/SameSite=Lax/i);

      delete process.env.SESSION_COOKIE_SECURE;
      const secureRes = await loginOnce("client9b@example.com");
      const secureCookie = secureRes.headers
        .getSetCookie()
        .find((c) => c.startsWith(`${SESSION_COOKIE}=`))!;
      expect(secureCookie).toMatch(/;\s*Secure/i);
    } finally {
      if (prev === undefined) delete process.env.SESSION_COOKIE_SECURE;
      else process.env.SESSION_COOKIE_SECURE = prev;
    }
  });

  it("claims a single-use code atomically: concurrent accepts succeed exactly once", async () => {
    const { kase, cookie } = await seedCaseWithCoordinator();
    const res = await inviteByCoordinator(cookie, kase.id, "race@example.com", "client");
    const inviteId = (await res.json()).invite.id as string;
    const code = extractInviteCode(fakeEmailProvider.outbox.at(-1)!.text);

    const { user: racer } = await createVerifiedUser("client", "race@example.com");
    const cookieA = await sessionCookieFor(racer.id);
    const cookieB = await sessionCookieFor(racer.id);

    const [resA, resB] = await Promise.all([
      acceptInviteRoute(postJson("/api/invites/accept", { code }, cookieHeader(cookieA))),
      acceptInviteRoute(postJson("/api/invites/accept", { code }, cookieHeader(cookieB))),
    ]);
    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 410]);

    const invite = await prisma.invite.findUniqueOrThrow({ where: { id: inviteId } });
    expect(invite.usedAt).not.toBeNull();
    expect(
      await prisma.caseMember.count({ where: { caseId: kase.id, memberRole: "client" } }),
    ).toBe(1);
  });

  it("invalidates the session server-side on logout", async () => {
    await createVerifiedUser("client", "client10@example.com");
    const { POST: logout } = await import("@/app/api/auth/logout/route");
    const { GET: me } = await import("@/app/api/auth/me/route");

    await requestOtp(postJson("/api/auth/otp/request", { email: "client10@example.com" }));
    const otp = extractOtp(fakeEmailProvider.outbox.at(-1)!.text);
    const verifyRes = await verifyOtp(
      postJson("/api/auth/otp/verify", { email: "client10@example.com", code: otp }),
    );
    const cookie = sessionCookieFrom(verifyRes.headers.getSetCookie());

    const { NextRequest } = await import("next/server");
    const meRes = await me(new NextRequest("http://localhost/api/auth/me", { headers: cookieHeader(cookie) }));
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.email).toBe("client10@example.com");
    expect(meBody.user.globalRole).toBe("client");

    const logoutRes = await logout(postJson("/api/auth/logout", {}, cookieHeader(cookie)));
    expect(logoutRes.status).toBe(200);
    const meAfter = await me(new NextRequest("http://localhost/api/auth/me", { headers: cookieHeader(cookie) }));
    expect(meAfter.status).toBe(401);
  });
});
