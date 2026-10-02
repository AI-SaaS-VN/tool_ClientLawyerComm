import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { decideReviewTask, type ReviewAction } from "@/modules/review/service";

export const dynamic = "force-dynamic";

export function decisionRoute(action: ReviewAction) {
  return async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await requireUser(req);
      const { id } = await params;
      const body = await readJson(req);
      const result = await decideReviewTask(id, user, action, body);
      // TODO(T11): audit
      return NextResponse.json({ task: result });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
