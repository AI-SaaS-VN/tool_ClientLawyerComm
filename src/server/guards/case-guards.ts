import type { Case, CaseMember, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";

// REQ-CASE-06 / REQ-PM-01: membership is re-validated against the database on
// every request, so a revocation denies the very next request (REQ-PM-08).
export async function requireCaseMember(caseId: string, user: User): Promise<CaseMember> {
  // REQ-PM-10: admin accounts never enter cases.
  if (user.globalRole === "admin") throw new ApiError(403, "forbidden");
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId: user.id } },
  });
  if (!member || member.status !== "active") throw new ApiError(403, "forbidden");
  // REQ-PM-02: the member role must match the account's global role.
  if (member.memberRole !== user.globalRole) throw new ApiError(403, "forbidden");
  return member;
}

export async function requireCaseManager(caseId: string, user: User): Promise<CaseMember> {
  const member = await requireCaseMember(caseId, user);
  if (member.memberRole !== "coordinator" || !member.canManage) {
    throw new ApiError(403, "forbidden");
  }
  return member;
}

export async function requireCaseReviewer(caseId: string, user: User): Promise<CaseMember> {
  const member = await requireCaseMember(caseId, user);
  if (member.memberRole !== "coordinator" || !member.canReview) {
    throw new ApiError(403, "forbidden");
  }
  return member;
}

// REQ-CASE-05: archived cases are read-only; write operations are rejected.
// Call this only after a membership guard, so non-members cannot distinguish
// a missing case from an archived one.
export async function requireWritableCase(caseId: string): Promise<Case> {
  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase) throw new ApiError(404, "not_found");
  if (kase.status !== "active") throw new ApiError(409, "case_archived");
  return kase;
}
