import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import { toProfileView, updateProfile } from "@/modules/clients/service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await readJson(req);
    const profile = await updateProfile(user, id, body);
    return NextResponse.json({ profile: toProfileView(profile) });
  } catch (error) {
    return errorResponse(error);
  }
}
