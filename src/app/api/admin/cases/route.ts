import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { createCaseWithParticipants, listCases } from "@/modules/admin/cases";
import { requireAdminMfa } from "@/server/guards/admin-guard";

export const dynamic = "force-dynamic";

// REQ-ADM-01: the MFA-guarded administrator lists all cases with metadata and
// the member roster only — never message or file content (REQ-PM-06).
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminMfa(req);
    const result = await listCases(admin);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

// REQ-ADM-02/03: create a case with its initial participants; one activation
// email per entered address, the administrator never a member (REQ-ADM-04).
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminMfa(req);
    const result = await createCaseWithParticipants(admin, await readJson(req));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
