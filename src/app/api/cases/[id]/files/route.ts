import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { listCaseFiles, uploadFile } from "@/modules/files/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, "invalid_multipart");
    }
    const file = await uploadFile(caseId, user, form);
    // TODO(T11): audit
    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id: caseId } = await params;
    const files = await listCaseFiles(caseId, user);
    return NextResponse.json({ files });
  } catch (error) {
    return errorResponse(error);
  }
}
