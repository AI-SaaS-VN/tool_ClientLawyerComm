import type { Case, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { assertValidTitle } from "@/modules/cases/title";
import { getUnreadCount } from "@/modules/messages/unread";
import {
  requireCaseManager,
  requireCaseMember,
  requireWritableCase,
} from "@/server/guards/case-guards";

export { assertValidTitle } from "@/modules/cases/title";

function optionalShortText(value: unknown, code: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || [...value].length > 80 || /[\r\n]/.test(value)) {
    throw new ApiError(400, code);
  }
  return value || null;
}

export function toCaseView(kase: Case) {
  return {
    id: kase.id,
    title: kase.title,
    refNo: kase.refNo,
    alias: kase.alias,
    clientOrgName: kase.clientOrgName,
    status: kase.status,
    createdAt: kase.createdAt,
  };
}

// Only coordinators create cases directly (lawyers go through case
// applications, REQ-CASE-01); the creator joins as a coordinator member with
// both duty flags on (REQ-CASE-02).
export async function createCase(
  actor: User,
  body: Record<string, unknown>,
): Promise<Case> {
  if (actor.globalRole !== "coordinator") throw new ApiError(403, "forbidden");
  assertValidTitle(body.title);
  const clientOrgName =
    typeof body.clientOrgName === "string" ? body.clientOrgName.trim() : "";
  if (!clientOrgName || [...clientOrgName].length > 200 || /[\r\n]/.test(clientOrgName)) {
    throw new ApiError(400, "invalid_client_org");
  }
  const kase = await prisma.case.create({
    data: {
      title: body.title,
      refNo: optionalShortText(body.refNo, "invalid_ref_no"),
      alias: optionalShortText(body.alias, "invalid_alias"),
      clientOrgName,
      createdBy: actor.id,
      members: {
        create: {
          userId: actor.id,
          memberRole: "coordinator",
          canManage: true,
          canReview: true,
        },
      },
    },
  });
  // TODO(T11): audit
  return kase;
}

export async function listMyCases(user: User) {
  if (user.globalRole === "admin") throw new ApiError(403, "forbidden");
  const memberships = await prisma.caseMember.findMany({
    where: { userId: user.id, status: "active" },
    include: { case: true },
    orderBy: { case: { updatedAt: "desc" } },
  });
  return Promise.all(
    memberships.map(async (m) => ({
      ...toCaseView(m.case),
      myMembership: {
        memberRole: m.memberRole,
        canManage: m.canManage,
        canReview: m.canReview,
      },
      unreadCount: await getUnreadCount(m.caseId, m.userId),
    })),
  );
}

// Member lists expose display names and roles only — never contact channels
// (REQ-PM-09).
export async function getCaseDetail(caseId: string, user: User) {
  await requireCaseMember(caseId, user);
  const kase = await prisma.case.findUnique({
    where: { id: caseId },
    include: { members: { include: { user: true } } },
  });
  if (!kase) throw new ApiError(404, "not_found");
  return {
    ...toCaseView(kase),
    unreadCount: await getUnreadCount(caseId, user.id),
    members: kase.members.map((m) => ({
      id: m.id,
      memberRole: m.memberRole,
      displayName: m.user.displayName,
      canManage: m.canManage,
      canReview: m.canReview,
      status: m.status,
    })),
  };
}

export async function archiveCase(caseId: string, actor: User): Promise<Case> {
  await requireCaseManager(caseId, actor);
  await requireWritableCase(caseId);
  const kase = await prisma.case.update({
    where: { id: caseId },
    data: { status: "archived" },
  });
  // TODO(T11): audit
  return kase;
}
