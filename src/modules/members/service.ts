import type { User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import {
  requireCaseManager,
  requireWritableCase,
} from "@/server/guards/case-guards";

// Revocation is idempotent and takes effect on the very next request because
// every guard re-reads this row (REQ-PM-08).
export async function revokeMember(
  caseId: string,
  targetUserId: string,
  actor: User,
): Promise<void> {
  await requireCaseManager(caseId, actor);
  await requireWritableCase(caseId);
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId: targetUserId } },
  });
  if (!member) throw new ApiError(404, "not_found");
  if (member.status !== "revoked") {
    await prisma.caseMember.update({
      where: { id: member.id },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }
  // TODO(T11): audit; close the member's live SSE connections (T04/T11)
}

// Duty flags exist only on coordinator memberships (REQ-PM-05); other roles
// keep both flags false. Either flag may be turned off individually.
export async function updateMemberFlags(
  caseId: string,
  targetUserId: string,
  actor: User,
  flags: { canManage?: unknown; canReview?: unknown },
): Promise<void> {
  await requireCaseManager(caseId, actor);
  await requireWritableCase(caseId);
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId: targetUserId } },
  });
  if (!member || member.status !== "active") throw new ApiError(404, "not_found");

  const data: { canManage?: boolean; canReview?: boolean } = {};
  for (const key of ["canManage", "canReview"] as const) {
    const value = flags[key];
    if (value === undefined) continue;
    if (typeof value !== "boolean") throw new ApiError(400, "invalid_flags");
    if (value && member.memberRole !== "coordinator") {
      throw new ApiError(400, "invalid_flags");
    }
    data[key] = value;
  }
  if (Object.keys(data).length === 0) throw new ApiError(400, "invalid_flags");
  await prisma.caseMember.update({ where: { id: member.id }, data });
  // TODO(T11): audit
}
