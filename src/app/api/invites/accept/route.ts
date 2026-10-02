import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { acceptInvite } from "@/modules/invites/service";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const code = typeof body.code === "string" ? body.code : "";
    if (!code) throw new ApiError(400, "invalid_request");
    const result = await acceptInvite(user, code);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
