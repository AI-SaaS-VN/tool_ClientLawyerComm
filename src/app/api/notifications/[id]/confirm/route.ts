import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { confirmUrgentAlert } from "@/modules/urgent/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const task = await confirmUrgentAlert(id, user);
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}
