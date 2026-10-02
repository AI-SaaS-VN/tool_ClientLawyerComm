import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { verifyBindOtp, verifyLoginOtp } from "@/modules/auth/service";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/modules/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email = typeof body.email === "string" ? body.email : "";
    const code = typeof body.code === "string" ? body.code : "";
    if (!email || !code) throw new ApiError(400, "invalid_request");

    if (body.purpose === "bind") {
      const user = await requireUser(req);
      await verifyBindOtp(user, email, code);
      return NextResponse.json({ ok: true });
    }

    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode : undefined;
    const { user, inviteAccepted, inviteError } = await verifyLoginOtp({
      email,
      code,
      inviteCode,
    });
    const session = await createSession(user.id);
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, globalRole: user.globalRole },
      inviteAccepted,
      ...(inviteError ? { inviteError } : {}),
    });
    res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
