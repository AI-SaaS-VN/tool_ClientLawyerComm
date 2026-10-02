import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { archiveCase, toCaseView } from "@/modules/cases/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const kase = await archiveCase(caseId, user);
    return NextResponse.json({ case: toCaseView(kase) });
  } catch (error) {
    return errorResponse(error);
  }
}
