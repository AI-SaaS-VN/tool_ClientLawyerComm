import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { listAuditLogs } from "@/modules/admin/audit-logs";
import { requireAdminMfa } from "@/server/guards/admin-guard";

export const dynamic = "force-dynamic";

// REQ-OPS-01: audit trail read access — MFA-enrolled administrators only.
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminMfa(req);
    const result = await listAuditLogs(admin, req.nextUrl.searchParams);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
