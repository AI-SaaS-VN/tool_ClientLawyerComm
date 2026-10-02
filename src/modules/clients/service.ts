import type { ClientProfile, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

export function toProfileView(profile: ClientProfile) {
  return {
    id: profile.id,
    name: profile.name,
    note: profile.note,
    status: profile.status,
    createdAt: profile.createdAt,
  };
}

function requireLawyer(user: User): void {
  // REQ-PM-04: only lawyers maintain client profiles.
  if (user.globalRole !== "lawyer") throw new ApiError(403, "forbidden");
}

function assertValidName(name: unknown): asserts name is string {
  if (typeof name !== "string") throw new ApiError(400, "invalid_name");
  const length = [...name.trim()].length;
  if (length < 1 || length > 200 || /[\r\n]/.test(name)) {
    throw new ApiError(400, "invalid_name");
  }
}

export async function createProfile(
  lawyer: User,
  body: Record<string, unknown>,
): Promise<ClientProfile> {
  requireLawyer(lawyer);
  assertValidName(body.name);
  if (body.note !== undefined && body.note !== null && typeof body.note !== "string") {
    throw new ApiError(400, "invalid_note");
  }
  const profile = await prisma.clientProfile.create({
    data: {
      lawyerId: lawyer.id,
      name: (body.name as string).trim(),
      note: (body.note as string | undefined) ?? null,
    },
  });
  // Registering a profile never triggers invitations or authorization
  // (REQ-CASE-01): it is visible to the registering lawyer only.
  return profile;
}

// There is deliberately no platform-wide listing: a lawyer only ever sees
// their own profiles (REQ-PM-04).
export async function listMyProfiles(lawyer: User): Promise<ClientProfile[]> {
  requireLawyer(lawyer);
  return prisma.clientProfile.findMany({
    where: { lawyerId: lawyer.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateProfile(
  lawyer: User,
  profileId: string,
  body: Record<string, unknown>,
): Promise<ClientProfile> {
  requireLawyer(lawyer);
  const profile = await prisma.clientProfile.findUnique({ where: { id: profileId } });
  if (!profile || profile.lawyerId !== lawyer.id) throw new ApiError(404, "not_found");

  const data: { name?: string; note?: string | null; status?: string } = {};
  if (body.name !== undefined) {
    assertValidName(body.name);
    data.name = (body.name as string).trim();
  }
  if (body.note !== undefined) {
    if (body.note !== null && typeof body.note !== "string") {
      throw new ApiError(400, "invalid_note");
    }
    data.note = body.note as string | null;
  }
  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "archived") {
      throw new ApiError(400, "invalid_status");
    }
    data.status = body.status;
  }
  if (Object.keys(data).length === 0) throw new ApiError(400, "invalid_body");
  return prisma.clientProfile.update({ where: { id: profile.id }, data });
}
