import { describe, expect, it } from "vitest";

import {
  OTP_DAILY_LIMIT,
  OTP_LOCK_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MIN_INTERVAL_MS,
  OTP_TTL_MS,
  checkSendAllowed,
  evaluateChallenge,
  generateOtp,
  hashOtp,
  utcDayStart,
} from "@/modules/auth/otp";

const NOW = new Date("2026-10-01T12:00:00.000Z");

describe("generateOtp", () => {
  it("generates a 6-digit numeric code", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("keeps leading zeros (uses the injected RNG per digit)", () => {
    const code = generateOtp(() => 0);
    expect(code).toBe("000000");
  });
});

describe("hashOtp", () => {
  it("is sha256 of code:challengeId and never equals the plaintext", () => {
    const hash = hashOtp("123456", "challenge-1");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe("123456");
    expect(hash).not.toContain("123456");
  });

  it("differs for the same code under a different challenge (cross-session rejection)", () => {
    expect(hashOtp("123456", "a")).not.toBe(hashOtp("123456", "b"));
  });
});

describe("checkSendAllowed", () => {
  it("allows the first send", () => {
    expect(checkSendAllowed({ lastSentAt: null, sentToday: 0, now: NOW })).toEqual({ ok: true });
  });

  it("rejects a resend inside the 60 second interval", () => {
    const lastSentAt = new Date(NOW.getTime() - OTP_MIN_INTERVAL_MS + 1);
    expect(checkSendAllowed({ lastSentAt, sentToday: 1, now: NOW })).toEqual({
      ok: false,
      reason: "interval",
    });
  });

  it("allows a resend exactly after the interval", () => {
    const lastSentAt = new Date(NOW.getTime() - OTP_MIN_INTERVAL_MS);
    expect(checkSendAllowed({ lastSentAt, sentToday: 1, now: NOW })).toEqual({ ok: true });
  });

  it("rejects when the daily cap is reached, regardless of interval", () => {
    const lastSentAt = new Date(NOW.getTime() - OTP_MIN_INTERVAL_MS * 10);
    expect(
      checkSendAllowed({ lastSentAt, sentToday: OTP_DAILY_LIMIT, now: NOW }),
    ).toEqual({ ok: false, reason: "daily_cap" });
  });
});

describe("utcDayStart", () => {
  it("returns midnight UTC of the same day", () => {
    expect(utcDayStart(new Date("2026-10-01T23:59:59.000Z")).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});

describe("evaluateChallenge", () => {
  const challenge = {
    expiresAt: new Date(NOW.getTime() + OTP_TTL_MS),
    attempts: 0,
    lockedUntil: null as Date | null,
    usedAt: null as Date | null,
  };
  const expected = hashOtp("123456", "c1");

  it("accepts the correct code", () => {
    expect(evaluateChallenge(challenge, expected, expected, NOW)).toEqual({ ok: true });
  });

  it("rejects a used challenge (replay)", () => {
    expect(
      evaluateChallenge({ ...challenge, usedAt: NOW }, expected, expected, NOW),
    ).toEqual({ ok: false, reason: "used" });
  });

  it("rejects an expired challenge", () => {
    expect(
      evaluateChallenge(
        { ...challenge, expiresAt: new Date(NOW.getTime() - 1) },
        expected,
        expected,
        NOW,
      ),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects while locked, even with the correct code", () => {
    const lockedUntil = new Date(NOW.getTime() + OTP_LOCK_MS);
    expect(
      evaluateChallenge({ ...challenge, lockedUntil }, expected, expected, NOW),
    ).toEqual({ ok: false, reason: "locked", lockedUntil });
  });

  it("counts a wrong attempt and locks on the 5th wrong attempt", () => {
    const wrong = hashOtp("000000", "c1");
    const first = evaluateChallenge(challenge, expected, wrong, NOW);
    expect(first).toEqual({ ok: false, reason: "wrong", attempts: 1, lockedUntil: null });

    const fifth = evaluateChallenge(
      { ...challenge, attempts: OTP_MAX_ATTEMPTS - 1 },
      expected,
      wrong,
      NOW,
    );
    expect(fifth.ok).toBe(false);
    if (!fifth.ok && fifth.reason === "wrong") {
      expect(fifth.attempts).toBe(OTP_MAX_ATTEMPTS);
      expect(fifth.lockedUntil?.getTime()).toBe(NOW.getTime() + OTP_LOCK_MS);
    } else {
      throw new Error("expected a wrong-code result");
    }
  });

  it("rejects a code minted for another challenge (cross-session use)", () => {
    const foreign = hashOtp("123456", "other-challenge");
    const result = evaluateChallenge(challenge, expected, foreign, NOW);
    expect(result.ok).toBe(false);
  });
});
