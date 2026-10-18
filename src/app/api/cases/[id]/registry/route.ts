import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import {
  getRegistryView,
  setRegistryManual,
  setRegistryQuery,
} from "@/modules/agent/target-company-registry";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

// REQ-REG-01: coordinator-only. Clients and lawyers get the same 404 as a
// missing case — the lookup's existence is never revealed.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    return NextResponse.json({ registry: await getRegistryView(caseId, user) });
  } catch (error) {
    return errorResponse(error);
  }
}

// REQ-REG-02: the coordinator supplies the target-company name (or tax code);
// setting it queues the lookup. A `text` body is a manual entry (v0.18) for
// when the host cannot reach the registry source.
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
    const registry =
      typeof body.text === "string"
        ? await setRegistryManual(caseId, user, body)
        : await setRegistryQuery(caseId, user, body);
    return NextResponse.json({ registry });
  } catch (error) {
    return errorResponse(error);
  }
}
