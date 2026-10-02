import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { appealReviewTask } from "@/modules/review/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await readJson(req);
    await appealReviewTask(id, user, body);
    // TODO(T11): audit
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
