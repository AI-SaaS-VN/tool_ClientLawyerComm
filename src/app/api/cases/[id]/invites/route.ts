import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { createInvite } from "@/modules/invites/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const body = await readJson(req);
    const { invite } = await createInvite({
      caseId,
      actor: user,
      email: typeof body.email === "string" ? body.email : "",
      role: body.role,
    });
    // The code itself and the notification address are never returned;
    // the code travels only in the activation email.
    return NextResponse.json({
      invite: { id: invite.id, caseId: invite.caseId, role: invite.role, expiresAt: invite.expiresAt },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
