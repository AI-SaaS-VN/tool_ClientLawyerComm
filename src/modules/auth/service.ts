import { randomUUID } from "node:crypto";

import type { ContactChannel, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { decryptText, encryptText, hashEmail, normalizeEmail } from "@/modules/auth/crypto";
import {
  OTP_TTL_MS,
  checkSendAllowed,
  evaluateChallenge,
  generateOtp,
  hashOtp,
  utcDayStart,
} from "@/modules/auth/otp";
import { acceptInvite, getValidInvite } from "@/modules/invites/service";
import { recordAudit } from "@/server/audit/log";
import { getEmailProvider } from "@/server/providers/email";

export type OtpPurpose = "login" | "bind";

async function sendOtpEmail(to: string, code: string, channelId: string): Promise<void> {
  try {
    await getEmailProvider().send({
      to,
      subject: "Your verification code",
      text: `Your verification code is: ${code}\nIt is valid for 10 minutes.`,
    });
  } catch {
    console.error("email_send_failed", { category: "otp" });
    await recordAudit(prisma, {
      action: "auth.otp_send",
      result: "failed",
      targetType: "contact_channel",
      targetId: channelId,
    });
  }
}

async function issueChallenge(
  channel: ContactChannel,
  purpose: OtpPurpose,
  now: Date,
): Promise<string> {
  const [lastChallenge, sentToday] = await Promise.all([
    prisma.otpChallenge.findFirst({
      where: { channelId: channel.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.otpChallenge.count({
      where: { channelId: channel.id, createdAt: { gte: utcDayStart(now) } },
    }),
  ]);
  const check = checkSendAllowed({
    lastSentAt: lastChallenge?.createdAt ?? null,
    sentToday,
    now,
  });
  if (!check.ok) throw new ApiError(429, "rate_limited", check.reason);

  const code = generateOtp();
  const id = randomUUID();
  // The hash binds the code to its challenge id (cross-session rejection).
  await prisma.otpChallenge.create({
    data: {
      id,
      channelId: channel.id,
      purpose,
      codeHash: hashOtp(code, id),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    },
  });
  return code;
}

// Neutral endpoint: unregistered addresses always look like a success and
// never receive a code (anti-enumeration). The audit trail records the
// attempt either way, keyed by channel id — never by address (REQ-OPS-01).
export async function requestLoginOtp(email: string, now: Date = new Date()) {
  const channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(email) },
  });
  if (!channel || !channel.verifiedAt) {
    await recordAudit(prisma, { action: "auth.otp_request", result: "ignored" });
    return { sent: false };
  }
  const code = await issueChallenge(channel, "login", now);
  await sendOtpEmail(decryptText(channel.valueEnc), code, channel.id);
  await recordAudit(prisma, {
    action: "auth.otp_request",
    result: "success",
    targetType: "contact_channel",
    targetId: channel.id,
  });
  return { sent: true };
}

// A valid invite code authorizes an OTP to a not-yet-registered address.
export async function requestInviteOtp(email: string, inviteCode: string, now: Date = new Date()) {
  const invite = await getValidInvite(inviteCode, now);
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) throw new ApiError(400, "invalid_email");

  let channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(normalized) },
  });
  if (!channel) {
    const user = await prisma.user.create({
      data: {
        displayName: normalized.split("@")[0] ?? "user",
        globalRole: invite.role,
        status: "pending",
      },
    });
    channel = await prisma.contactChannel.create({
      data: {
        userId: user.id,
        valueEnc: encryptText(normalized),
        valueHash: hashEmail(normalized),
        isPrimary: true,
      },
    });
  }
  const code = await issueChallenge(channel, "login", now);
  await sendOtpEmail(normalized, code, channel.id);
  await recordAudit(prisma, {
    action: "auth.otp_request",
    result: "success",
    targetType: "contact_channel",
    targetId: channel.id,
    meta: { purpose: "invite" },
  });
  return { sent: true };
}

// REQ-AUTH-08: binding a second email requires an OTP inside an
// authenticated session. Another account's address is never challenged.
export async function requestBindOtp(user: User, email: string, now: Date = new Date()) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) throw new ApiError(400, "invalid_email");

  let channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(normalized) },
  });
  if (channel && channel.userId !== user.id) return { sent: false };
  if (!channel) {
    channel = await prisma.contactChannel.create({
      data: {
        userId: user.id,
        valueEnc: encryptText(normalized),
        valueHash: hashEmail(normalized),
        isPrimary: false,
      },
    });
  }
  const code = await issueChallenge(channel, "bind", now);
  await sendOtpEmail(normalized, code, channel.id);
  await recordAudit(prisma, {
    actorId: user.id,
    action: "auth.otp_request",
    result: "success",
    targetType: "contact_channel",
    targetId: channel.id,
    meta: { purpose: "bind" },
  });
  return { sent: true };
}

async function verifyChallenge(channel: ContactChannel, purpose: OtpPurpose, code: string, now: Date) {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { channelId: channel.id, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) throw new ApiError(401, "invalid_code");

  const result = evaluateChallenge(challenge, challenge.codeHash, hashOtp(code, challenge.id), now);
  if (!result.ok) {
    if (result.reason === "wrong") {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: result.attempts, lockedUntil: result.lockedUntil },
      });
      throw new ApiError(401, "invalid_code");
    }
    if (result.reason === "locked") throw new ApiError(429, "locked");
    throw new ApiError(401, result.reason === "used" ? "code_used" : "code_expired");
  }
  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { usedAt: now } });
  return challenge;
}

export async function verifyLoginOtp(input: {
  email: string;
  code: string;
  inviteCode?: string;
  now?: Date;
}): Promise<{ user: User; inviteAccepted: boolean; inviteError?: string }> {
  const now = input.now ?? new Date();
  const channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(input.email) },
    include: { user: true },
  });
  if (!channel) {
    await recordAudit(prisma, {
      action: "auth.login",
      result: "denied",
      meta: { reason: "invalid_code" },
    });
    throw new ApiError(401, "invalid_code");
  }

  try {
    await verifyChallenge(channel, "login", input.code, now);
  } catch (error) {
    // REQ-OPS-01: failed verification attempts are auditable too, keyed by
    // user id with the error category — never the submitted code.
    await recordAudit(prisma, {
      action: "auth.login",
      result: "denied",
      targetType: "user",
      targetId: channel.userId,
      meta: { reason: error instanceof ApiError ? error.code : "invalid_code" },
    });
    throw error;
  }
  await prisma.contactChannel.update({
    where: { id: channel.id },
    data: { verifiedAt: channel.verifiedAt ?? now },
  });
  await prisma.user.updateMany({
    where: { id: channel.userId, status: "pending" },
    data: { status: "active" },
  });

  let inviteAccepted = false;
  let inviteError: string | undefined;
  if (input.inviteCode) {
    try {
      await acceptInvite(channel.user, input.inviteCode, now);
      inviteAccepted = true;
    } catch (error) {
      // Login itself still succeeds; only the join is refused.
      inviteError = error instanceof ApiError ? error.code : "invite_failed";
    }
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: channel.userId } });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "auth.login",
    result: "success",
    targetType: "user",
    targetId: user.id,
    meta: { inviteAccepted },
  });
  return { user, inviteAccepted, inviteError };
}

export async function verifyBindOtp(user: User, email: string, code: string, now: Date = new Date()) {
  const channel = await prisma.contactChannel.findUnique({
    where: { valueHash: hashEmail(email) },
  });
  if (!channel || channel.userId !== user.id) throw new ApiError(401, "invalid_code");
  try {
    await verifyChallenge(channel, "bind", code, now);
  } catch (error) {
    await recordAudit(prisma, {
      actorId: user.id,
      action: "auth.channel_bind",
      result: "denied",
      targetType: "contact_channel",
      targetId: channel.id,
      meta: { reason: error instanceof ApiError ? error.code : "invalid_code" },
    });
    throw error;
  }
  const updated = await prisma.contactChannel.update({
    where: { id: channel.id },
    data: { verifiedAt: channel.verifiedAt ?? now },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "auth.channel_bind",
    result: "success",
    targetType: "contact_channel",
    targetId: channel.id,
  });
  return updated;
}
