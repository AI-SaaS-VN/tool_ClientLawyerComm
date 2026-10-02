import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { listMessages, sendMessage } from "@/modules/messages/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const body = await readJson(req);
    const result = await sendMessage(caseId, user, body, req.headers);
    // TODO(T11): audit
    return NextResponse.json({ message: result.view }, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const mode = req.nextUrl.searchParams.get("mode") ?? "auto";
    if (mode !== "auto" && mode !== "manual") throw new ApiError(400, "invalid_mode");
    const messages = await listMessages(caseId, user, req.nextUrl.searchParams.get("after"), mode);
    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}
