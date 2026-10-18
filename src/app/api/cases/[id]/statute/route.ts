import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { confirmStatute } from "@/modules/agent/statute-brief";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

// REQ-STAT-01: coordinator-only (404 for client/lawyer, same as the brief).
// Confirming selected links stores the statute note in the brief record.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    return NextResponse.json(await confirmStatute(caseId, user, body));
  } catch (error) {
    return errorResponse(error);
  }
}
