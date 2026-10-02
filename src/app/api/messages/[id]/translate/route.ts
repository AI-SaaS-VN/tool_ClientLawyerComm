import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { requestTranslation } from "@/modules/translation/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: messageId } = await params;
    const body = await readJson(req);
    const result = await requestTranslation(messageId, user, body);
    // TODO(T11): audit
    return NextResponse.json(
      { translation: result.view },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
