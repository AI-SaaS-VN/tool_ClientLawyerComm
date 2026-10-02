import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { decideApplication, toApplicationView } from "@/modules/applications/service";
import { toCaseView } from "@/modules/cases/service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await readJson(req);
    const { application, kase } = await decideApplication(user, id, body);
    return NextResponse.json({
      application: toApplicationView(application),
      case: kase ? toCaseView(kase) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
