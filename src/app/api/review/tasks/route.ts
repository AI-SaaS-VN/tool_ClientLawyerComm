import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { listReviewTasks } from "@/modules/review/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const tasks = await listReviewTasks(user);
    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse(error);
  }
}
