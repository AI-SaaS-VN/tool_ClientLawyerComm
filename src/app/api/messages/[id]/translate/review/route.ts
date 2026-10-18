import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { getReviewTranslation } from "@/modules/translation/service";

export const dynamic = "force-dynamic";

// REQ-TR-05: the coordinator reads the flagged (needs_review) text here
// before deciding to release it. Non-coordinators get a plain 404.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: messageId } = await params;
    const targetLang = req.nextUrl.searchParams.get("targetLang") ?? "";
    return NextResponse.json({ review: await getReviewTranslation(messageId, user, targetLang) });
  } catch (error) {
    return errorResponse(error);
  }
}
