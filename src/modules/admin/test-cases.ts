import type { User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/modules/auth/crypto";
import { ensurePendingRecipient, type ParticipantEntry } from "@/modules/admin/cases";
import { assertValidTitle } from "@/modules/cases/title";
import { issueInvite, type InvitableRole } from "@/modules/invites/service";
import { recordAudit } from "@/server/audit/log";

const DEFAULT_CLIENT_ORG = "Fictitious Test Client 虚构测试客户";

function readEmail(value: unknown): string {
  const email = typeof value === "string" ? normalizeEmail(value) : "";
  if (!email || !email.includes("@")) throw new ApiError(400, "invalid_email");
  return email;
}

function readDisplayName(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || [...value].length > 80 || /[\r\n]/.test(value)) {
    throw new ApiError(400, "invalid_display_name");
  }
  return value;
}

function readClientOrgName(value: unknown): string {
  if (value === undefined || value === null || value === "") return DEFAULT_CLIENT_ORG;
  if (typeof value !== "string" || [...value].length > 200 || /[\r\n]/.test(value)) {
    throw new ApiError(400, "invalid_client_org");
  }
  return value;
}

// REQ-OPS-07: the MFA-guarded administrator creates one fictitious test case
// and the system sends one activation email to each of the three entered
// addresses — coordinator, Chinese client, Vietnamese lawyer — and to no one
// else. The administrator never becomes a case member.
export async function createTestCase(
  admin: User,
  body: Record<string, unknown>,
): Promise<{ caseId: string; title: string; invites: Array<{ id: string; role: InvitableRole }> }> {
  assertValidTitle(body.title);
  const entries: ParticipantEntry[] = [
    {
      role: "coordinator",
      email: readEmail(body.coordinatorEmail),
      displayName: readDisplayName(body.coordinatorDisplayName),
    },
    {
      role: "client",
      email: readEmail(body.clientEmail),
      displayName: readDisplayName(body.clientDisplayName),
    },
    {
      role: "lawyer",
      email: readEmail(body.lawyerEmail),
      displayName: readDisplayName(body.lawyerDisplayName),
    },
  ];
  if (new Set(entries.map((entry) => entry.email)).size !== entries.length) {
    throw new ApiError(400, "invalid_email");
  }

  const kase = await prisma.case.create({
    data: {
      title: body.title,
      clientOrgName: readClientOrgName(body.clientOrgName),
      createdBy: admin.id,
    },
  });
  await recordAudit(prisma, {
    actorId: admin.id,
    action: "case.create",
    result: "success",
    targetType: "case",
    targetId: kase.id,
    caseId: kase.id,
    meta: { origin: "admin_test_case" },
  });

  const invites: Array<{ id: string; role: InvitableRole }> = [];
  for (const entry of entries) {
    await ensurePendingRecipient(entry);
    const { invite } = await issueInvite({
      caseId: kase.id,
      actorId: admin.id,
      email: entry.email,
      role: entry.role,
    });
    invites.push({ id: invite.id, role: entry.role });
  }
  return { caseId: kase.id, title: kase.title, invites };
}
