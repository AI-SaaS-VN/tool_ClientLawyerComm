import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { revokeMemberAsAdmin } from "@/modules/admin/cases";
import { requireAdminMfa } from "@/server/guards/admin-guard";

export const dynamic = "force-dynamic";

// REQ-ADM-03: the MFA-guarded administrator revokes a member with the same
// immediate-effect semantics as the coordinator flow (REQ-PM-08).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; uid: string }> }) {
  try {
    const admin = await requireAdminMfa(req);
    const { id: caseId, uid } = await params;
    await revokeMemberAsAdmin(admin, caseId, uid);
    return NextResponse.json({ revoked: true });
  } catch (error) {
    return errorResponse(error);
  }
}
