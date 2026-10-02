import type { Case, CaseApplication, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { assertValidTitle } from "@/modules/cases/service";
import { recordAudit } from "@/server/audit/log";

export function toApplicationView(application: CaseApplication) {
  return {
    id: application.id,
    clientProfileId: application.clientProfileId,
    summary: application.summary,
    status: application.status,
    createdAt: application.createdAt,
  };
}

function requireLawyer(user: User): void {
  if (user.globalRole !== "lawyer") throw new ApiError(403, "forbidden");
}

function requireCoordinator(user: User): void {
  if (user.globalRole !== "coordinator") throw new ApiError(403, "forbidden");
}

// REQ-PM-04: a lawyer submits a case-creation application against one of
// their own client profiles; they cannot join a case on their own.
export async function submitApplication(
  lawyer: User,
  body: Record<string, unknown>,
): Promise<CaseApplication> {
  requireLawyer(lawyer);
  if (typeof body.clientProfileId !== "string") throw new ApiError(400, "invalid_body");
  const profile = await prisma.clientProfile.findUnique({
    where: { id: body.clientProfileId },
  });
  if (!profile || profile.lawyerId !== lawyer.id) throw new ApiError(404, "not_found");
  if (profile.status !== "active") throw new ApiError(409, "profile_archived");
  if (typeof body.summary !== "string" || body.summary.trim().length === 0) {
    throw new ApiError(400, "invalid_summary");
  }
  const application = await prisma.caseApplication.create({
    data: {
      lawyerId: lawyer.id,
      clientProfileId: profile.id,
      summary: body.summary.trim(),
    },
  });
  await recordAudit(prisma, {
    actorId: lawyer.id,
    action: "case_application.submit",
    result: "success",
    targetType: "case_application",
    targetId: application.id,
  });
  return application;
}

export async function listApplications(user: User): Promise<CaseApplication[]> {
  if (user.globalRole === "lawyer") {
    return prisma.caseApplication.findMany({
      where: { lawyerId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }
  if (user.globalRole === "coordinator") {
    return prisma.caseApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });
  }
  throw new ApiError(403, "forbidden");
}

// REQ-CASE-01: approval creates the case; the deciding coordinator becomes a
// coordinator member with both duty flags and the applicant a lawyer member.
export async function decideApplication(
  actor: User,
  applicationId: string,
  body: Record<string, unknown>,
): Promise<{ application: CaseApplication; kase: Case | null }> {
  requireCoordinator(actor);
  if (body.decision !== "approved" && body.decision !== "rejected") {
    throw new ApiError(400, "invalid_decision");
  }
  const decision = body.decision;

  if (decision === "approved") {
    assertValidTitle(body.title);
  }

  const decided = await prisma.$transaction(async (tx) => {
    const application = await tx.caseApplication.findUnique({
      where: { id: applicationId },
      include: { clientProfile: true },
    });
    if (!application) throw new ApiError(404, "not_found");
    if (application.status !== "pending") throw new ApiError(409, "already_decided");

    let kase: Case | null = null;
    if (decision === "approved") {
      const clientOrgName =
        typeof body.clientOrgName === "string" && body.clientOrgName.trim()
          ? body.clientOrgName.trim()
          : application.clientProfile.name;
      kase = await tx.case.create({
        data: {
          title: body.title as string,
          clientOrgName,
          createdBy: actor.id,
          members: {
            create: [
              {
                userId: actor.id,
                memberRole: "coordinator",
                canManage: true,
                canReview: true,
              },
              { userId: application.lawyerId, memberRole: "lawyer" },
            ],
          },
        },
      });
    }

    const updated = await tx.caseApplication.update({
      where: { id: application.id },
      data: { status: decision, decidedBy: actor.id },
    });
    return { application: updated, kase };
  });
  await recordAudit(prisma, {
    actorId: actor.id,
    action: "case_application.decide",
    result: "success",
    targetType: "case_application",
    targetId: decided.application.id,
    caseId: decided.kase?.id ?? null,
    meta: { decision },
  });
  return decided;
}
