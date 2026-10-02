import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { createTestCase } from "@/modules/admin/test-cases";
import { requireAdminMfa } from "@/server/guards/admin-guard";

export const dynamic = "force-dynamic";

// REQ-OPS-07: one fictitious test case with three activation emails, for the
// bootstrapped, MFA-enrolled administrator. MFA-guarded like every admin API.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminMfa(req);
    const result = await createTestCase(admin, await readJson(req));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
