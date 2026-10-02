import type { User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { decryptText, encryptText } from "@/modules/auth/crypto";
import { recordAudit } from "@/server/audit/log";
import { buildOtpauthUri, generateTotpSecret, verifyTotpCode } from "@/server/auth/mfa";

// REQ-AUTH-09/11: only dedicated admin accounts enroll TOTP MFA (the account
// itself comes from the local bootstrap, never an invitation). The secret is
// stored encrypted like registered contact channels; the plaintext leaves
// the server exactly once, in this response.
export async function enrollMfa(user: User): Promise<{ secret: string; uri: string }> {
  if (user.globalRole !== "admin") throw new ApiError(403, "forbidden");
  if (user.mfaEnrolledAt) throw new ApiError(409, "mfa_already_enrolled");
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecretRef: encryptText(secret), mfaEnrolledAt: null },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "admin.mfa_enroll",
    result: "success",
    targetType: "user",
    targetId: user.id,
  });
  return { secret, uri: buildOtpauthUri(secret, user.displayName) };
}

// Enrollment completes only when the admin proves they hold the secret.
export async function verifyMfaEnrollment(
  user: User,
  code: unknown,
  now: number = Date.now(),
): Promise<{ enrolled: true }> {
  if (user.globalRole !== "admin") throw new ApiError(403, "forbidden");
  if (user.mfaEnrolledAt) throw new ApiError(409, "mfa_already_enrolled");
  if (!user.mfaSecretRef) throw new ApiError(400, "mfa_not_started");
  if (typeof code !== "string" || !verifyTotpCode(decryptText(user.mfaSecretRef), code, now)) {
    await recordAudit(prisma, {
      actorId: user.id,
      action: "admin.mfa_verify",
      result: "denied",
      targetType: "user",
      targetId: user.id,
    });
    throw new ApiError(403, "mfa_invalid");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnrolledAt: new Date() },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "admin.mfa_verify",
    result: "success",
    targetType: "user",
    targetId: user.id,
  });
  return { enrolled: true };
}
