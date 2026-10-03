import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/modules/auth/session";
import { activateByEmailAndCode } from "@/modules/invites/service";

// v1.11: no session yet. The invited email plus the activation code is enough.
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email = typeof body.email === "string" ? body.email : "";
    const code = typeof body.code === "string" ? body.code : "";
    if (!email || !code) throw new ApiError(400, "invalid_request");
    const result = await activateByEmailAndCode(email, code);
    const session = await createSession(result.user.id);
    const res = NextResponse.json({
      ok: true,
      caseId: result.caseId,
      role: result.role,
      alreadyMember: result.alreadyMember,
      user: { id: result.user.id, globalRole: result.user.globalRole },
    });
    res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
