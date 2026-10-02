import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { retryFileScan } from "@/modules/files/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const file = await retryFileScan(id, user);
    // TODO(T11): audit
    return NextResponse.json({ file }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
