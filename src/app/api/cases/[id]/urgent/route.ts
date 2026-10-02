import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { listSentUrgentAlerts, sendUrgentAlerts } from "@/modules/urgent/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const body = await readJson(req);
    const { tasks } = await sendUrgentAlerts(caseId, user, body);
    return NextResponse.json({ tasks }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const tasks = await listSentUrgentAlerts(caseId, user);
    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse(error);
  }
}
