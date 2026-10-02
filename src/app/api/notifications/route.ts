import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { listIncomingUrgentAlerts } from "@/modules/urgent/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const notifications = await listIncomingUrgentAlerts(user);
    return NextResponse.json({ notifications });
  } catch (error) {
    return errorResponse(error);
  }
}
