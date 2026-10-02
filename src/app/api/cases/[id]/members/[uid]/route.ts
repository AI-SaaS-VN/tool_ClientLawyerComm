import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { revokeMember, updateMemberFlags } from "@/modules/members/service";

type Ctx = { params: Promise<{ id: string; uid: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id: caseId, uid } = await params;
    await revokeMember(caseId, uid, user);
    return NextResponse.json({ revoked: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id: caseId, uid } = await params;
    const body = await readJson(req);
    await updateMemberFlags(caseId, uid, user, body);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
