import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { requestLoginOtp } from "@/modules/auth/service";

export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email = typeof body.email === "string" ? body.email : "";
    if (!email) throw new ApiError(400, "invalid_email");
    // Activation is email + activation code (POST /api/invites/activate).
    // This route only signs in an address that is already verified.
    await requestLoginOtp(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
