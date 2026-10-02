import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { SESSION_COOKIE, revokeSession } from "@/modules/auth/session";

export async function POST(req: NextRequest) {
  try {
    await revokeSession(req.cookies.get(SESSION_COOKIE)?.value);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
