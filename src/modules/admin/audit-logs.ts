import type { AuditLog, Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";

export function toAuditLogView(row: AuditLog) {
  return {
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    caseId: row.caseId,
    result: row.result,
    meta: row.metaJson,
    createdAt: row.createdAt,
  };
}

// REQ-OPS-01: the audit trail is readable only by MFA-enrolled
// administrators (the route guards that). Filters from 简: case, action,
// actor; id-cursor pagination, newest first.
export async function listAuditLogs(
  actor: User,
  query: URLSearchParams,
): Promise<{ logs: Array<ReturnType<typeof toAuditLogView>>; nextCursor: string | null }> {
  const rawLimit = Number.parseInt(query.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;
  const where: Prisma.AuditLogWhereInput = {};
  const caseId = query.get("caseId");
  const action = query.get("action");
  const actorId = query.get("actorId");
  if (caseId) where.caseId = caseId;
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  const cursor = query.get("cursor");

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  await recordAudit(prisma, {
    actorId: actor.id,
    action: "admin.audit_logs_list",
    result: "success",
    meta: {
      filtered: Boolean(caseId || action || actorId),
    },
  });
  const page = rows.slice(0, limit);
  return {
    logs: page.map(toAuditLogView),
    nextCursor: rows.length > limit ? page[page.length - 1]!.id : null,
  };
}
