import { beforeEach, describe, expect, it } from "vitest";

import { POST as bindChannel } from "@/app/api/auth/channels/route";
import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { prisma } from "@/lib/db";
import { fakeEmailProvider } from "@/server/providers/email/fake";

import {
  cookieHeader,
  createVerifiedUser,
  extractOtp,
  postJson,
  resetDatabase,
  sessionCookieFor,
} from "../helpers";

describe("binding a second email channel (REQ-AUTH-08)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("binds a second email after OTP verification inside an authenticated session", async () => {
    const { user } = await createVerifiedUser("lawyer", "lawyer2@example.com");
    const cookie = await sessionCookieFor(user.id);

    const bindRes = await bindChannel(
      postJson("/api/auth/channels", { email: "second1@example.com" }, cookieHeader(cookie)),
    );
    expect(bindRes.status).toBe(200);
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.to).toBe("second1@example.com");
    const otp = extractOtp(fakeEmailProvider.outbox[0]!.text);

    const verifyRes = await verifyOtp(
      postJson(
        "/api/auth/otp/verify",
        { email: "second1@example.com", code: otp, purpose: "bind" },
        cookieHeader(cookie),
      ),
    );
    expect(verifyRes.status).toBe(200);

    const channels = await prisma.contactChannel.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    expect(channels).toHaveLength(2);
    expect(channels[1]!.verifiedAt).not.toBeNull();
    expect(channels[1]!.isPrimary).toBe(false);
  });

  it("rejects binding without an authenticated session", async () => {
    const res = await bindChannel(postJson("/api/auth/channels", { email: "second2@example.com" }));
    expect(res.status).toBe(401);
    expect(fakeEmailProvider.outbox).toHaveLength(0);

    const verifyRes = await verifyOtp(
      postJson("/api/auth/otp/verify", {
        email: "second2@example.com",
        code: "123456",
        purpose: "bind",
      }),
    );
    expect(verifyRes.status).toBe(401);
  });

  it("never lets a user bind an email owned by another account", async () => {
    const { user } = await createVerifiedUser("client", "client11@example.com");
    await createVerifiedUser("lawyer", "taken@example.com");
    const cookie = await sessionCookieFor(user.id);

    const res = await bindChannel(
      postJson("/api/auth/channels", { email: "taken@example.com" }, cookieHeader(cookie)),
    );
    expect(res.status).toBe(200);
    // Neutral response, but nothing was sent and nothing was created.
    expect(fakeEmailProvider.outbox).toHaveLength(0);
    expect(await prisma.contactChannel.count({ where: { userId: user.id } })).toBe(1);
  });

  it("rejects a login OTP reused for the bind purpose (cross-session use)", async () => {
    const { user } = await createVerifiedUser("client", "client12@example.com");
    const cookie = await sessionCookieFor(user.id);

    await requestOtp(postJson("/api/auth/otp/request", { email: "client12@example.com" }));
    const otp = extractOtp(fakeEmailProvider.outbox.at(-1)!.text);

    const res = await verifyOtp(
      postJson(
        "/api/auth/otp/verify",
        { email: "client12@example.com", code: otp, purpose: "bind" },
        cookieHeader(cookie),
      ),
    );
    expect(res.status).toBe(401);
  });
});
