import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { createCase, listMyCases, toCaseView } from "@/modules/cases/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const cases = await listMyCases(user);
    return NextResponse.json({ cases });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const kase = await createCase(user, body);
    return NextResponse.json({ case: toCaseView(kase) });
  } catch (error) {
    return errorResponse(error);
  }
}
