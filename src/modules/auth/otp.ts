import { createHash, randomInt } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_MS = 15 * 60 * 1000;
export const OTP_MIN_INTERVAL_MS = 60 * 1000;
export const OTP_DAILY_LIMIT = 10;

export function generateOtp(rand: (max: number) => number = (max) => randomInt(0, max)): string {
  let out = "";
  for (let i = 0; i < OTP_LENGTH; i++) out += String(rand(10));
  return out;
}

export function hashOtp(code: string, challengeId: string): string {
  return createHash("sha256").update(`${code}:${challengeId}`).digest("hex");
}

export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type SendCheck = { ok: true } | { ok: false; reason: "interval" | "daily_cap" };

export function checkSendAllowed(input: {
  lastSentAt: Date | null;
  sentToday: number;
  now: Date;
}): SendCheck {
  if (input.sentToday >= OTP_DAILY_LIMIT) return { ok: false, reason: "daily_cap" };
  if (input.lastSentAt && input.now.getTime() - input.lastSentAt.getTime() < OTP_MIN_INTERVAL_MS) {
    return { ok: false, reason: "interval" };
  }
  return { ok: true };
}

export type ChallengeState = {
  expiresAt: Date;
  attempts: number;
  lockedUntil: Date | null;
  usedAt: Date | null;
};

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "used" | "expired" | "locked"; lockedUntil?: Date | null }
  | { ok: false; reason: "wrong"; attempts: number; lockedUntil: Date | null };

export function evaluateChallenge(
  challenge: ChallengeState,
  expectedHash: string,
  presentedHash: string,
  now: Date,
): VerifyResult {
  if (challenge.usedAt) return { ok: false, reason: "used" };
  if (challenge.lockedUntil && challenge.lockedUntil.getTime() > now.getTime()) {
    return { ok: false, reason: "locked", lockedUntil: challenge.lockedUntil };
  }
  if (challenge.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (presentedHash !== expectedHash) {
    const attempts = challenge.attempts + 1;
    const lockedUntil =
      attempts >= OTP_MAX_ATTEMPTS ? new Date(now.getTime() + OTP_LOCK_MS) : null;
    return { ok: false, reason: "wrong", attempts, lockedUntil };
  }
  return { ok: true };
}
