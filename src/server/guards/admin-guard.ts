import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { decryptText } from "@/modules/auth/crypto";
import { requireUser } from "@/modules/auth/require-user";
import { verifyTotpCode } from "@/server/auth/mfa";

export const TOTP_HEADER = "x-totp-code";

// REQ-AUTH-09 / REQ-PM-10: every administrative API goes through this guard.
// An admin without enrolled MFA gets 403 mfa_not_enrolled; an enrolled admin
// must present a currently valid TOTP code on every admin request.
export async function requireAdminMfa(req: NextRequest): Promise<User> {
  const user = await requireUser(req);
  if (user.globalRole !== "admin") throw new ApiError(403, "forbidden");
  if (!user.mfaEnrolledAt || !user.mfaSecretRef) {
    throw new ApiError(403, "mfa_not_enrolled");
  }
  const code = req.headers.get(TOTP_HEADER) ?? "";
  if (!verifyTotpCode(decryptText(user.mfaSecretRef), code, Date.now())) {
    throw new ApiError(403, "mfa_invalid");
  }
  return user;
}
