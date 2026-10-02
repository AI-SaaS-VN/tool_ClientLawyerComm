import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { getCaseDetail } from "@/modules/cases/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const detail = await getCaseDetail(caseId, user);
    return NextResponse.json({ case: detail });
  } catch (error) {
    return errorResponse(error);
  }
}
