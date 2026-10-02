import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, readJson } from "@/lib/http";
import { requireUser } from "@/modules/auth/require-user";
import {
  createProfile,
  listMyProfiles,
  toProfileView,
} from "@/modules/clients/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profiles = await listMyProfiles(user);
    return NextResponse.json({ profiles: profiles.map(toProfileView) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await readJson(req);
    const profile = await createProfile(user, body);
    return NextResponse.json({ profile: toProfileView(profile) });
  } catch (error) {
    return errorResponse(error);
  }
}
