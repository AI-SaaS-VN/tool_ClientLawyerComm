import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { enrollMfa } from "@/modules/admin/mfa";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

// REQ-AUTH-09/11: admin-only TOTP enrollment. The secret and otpauth:// URI
// are returned once; enrollment completes via POST /api/auth/mfa/verify.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const result = await enrollMfa(user);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
