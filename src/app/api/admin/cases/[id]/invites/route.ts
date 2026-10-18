import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { addParticipant } from "@/modules/admin/cases";
import { requireAdminMfa } from "@/server/guards/admin-guard";

export const dynamic = "force-dynamic";

// REQ-ADM-03: the MFA-guarded administrator adds one participant to an
// existing case through the standard invitation flow.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminMfa(req);
    const { id: caseId } = await params;
    const result = await addParticipant(admin, caseId, await readJson(req));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
