import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { verifyMfaEnrollment } from "@/modules/admin/mfa";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const result = await verifyMfaEnrollment(user, body.code);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
