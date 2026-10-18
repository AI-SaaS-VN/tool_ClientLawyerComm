import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { releaseTranslation } from "@/modules/translation/service";

export const dynamic = "force-dynamic";

// REQ-TR-05: the coordinator releases a needs_review translation; reading
// views then show the text with the machine tag. Audited with the checker
// verdict. Non-coordinators get a plain 404.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: messageId } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    return NextResponse.json({ translation: (await releaseTranslation(messageId, user, body)).view });
  } catch (error) {
    return errorResponse(error);
  }
}
