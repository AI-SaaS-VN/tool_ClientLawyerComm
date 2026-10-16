import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { confirmBrief, getBriefView } from "@/modules/agent/coordinator-brief";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

// REQ-BRIEF-01: coordinator-only. Clients and lawyers get the same 404 as a
// missing case — the brief's existence is never revealed.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    return NextResponse.json({ brief: await getBriefView(caseId, user) });
  } catch (error) {
    return errorResponse(error);
  }
}

// REQ-BRIEF-02: the brief is written only on coordinator confirm.
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
    return NextResponse.json({ brief: await confirmBrief(caseId, user, body) });
  } catch (error) {
    return errorResponse(error);
  }
}
