import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { getBilingualJobView, requestBilingualConversion } from "@/modules/bilingual/service";
import { requireUser } from "@/modules/auth/require-user";

export const dynamic = "force-dynamic";

// REQ-DOC-01: explicit user request on an accessible DOCX file.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    return NextResponse.json({ job: await requestBilingualConversion(id, user) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// The latest job status, for the file row. Visible to anyone who can see the
// file.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    return NextResponse.json({ job: await getBilingualJobView(id, user) });
  } catch (error) {
    return errorResponse(error);
  }
}
