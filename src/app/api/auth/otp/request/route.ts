import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { requestInviteOtp, requestLoginOtp } from "@/modules/auth/service";

export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email = typeof body.email === "string" ? body.email : "";
    if (!email) throw new ApiError(400, "invalid_email");
    if (typeof body.inviteCode === "string" && body.inviteCode) {
      await requestInviteOtp(email, body.inviteCode);
    } else {
      await requestLoginOtp(email);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
