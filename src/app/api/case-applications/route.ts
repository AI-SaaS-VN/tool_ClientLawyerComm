import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import {
  listApplications,
  submitApplication,
  toApplicationView,
} from "@/modules/applications/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const applications = await listApplications(user);
    return NextResponse.json({ applications: applications.map(toApplicationView) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const application = await submitApplication(user, body);
    return NextResponse.json({ application: toApplicationView(application) });
  } catch (error) {
    return errorResponse(error);
  }
}
