import { Prisma, type User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import {
  URGENT_OPEN_STATUSES,
  isUrgentInCooldown,
  peerUrgentDedupeKey,
} from "@/modules/notifications/dedupe";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { recordAudit } from "@/server/audit/log";
import { pickEmailChannel } from "@/server/jobs/queue";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface UrgentTaskView {
  id: string;
  recipientUserId: string;
  status: string;
  lastError: string | null;
  deduped: boolean;
}

// REQ-NTF-02: recipients come only as user ids of active members of the same
// case — arbitrary addresses can never be entered. Returns the validated,
// de-duplicated recipient list in first-seen order.
function parseRecipientIds(body: Record<string, unknown>): string[] {
  const raw: unknown[] = [];
  if (Array.isArray(body.recipientUserIds)) raw.push(...body.recipientUserIds);
  if (typeof body.recipientUserId === "string") raw.push(body.recipientUserId);
  const ids: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string" || !UUID_RE.test(value)) {
      throw new ApiError(400, "invalid_recipient");
    }
    if (!ids.includes(value)) ids.push(value);
  }
  if (ids.length === 0) throw new ApiError(400, "invalid_recipient");
  return ids;
}

// REQ-NTF-05: a live (non-terminal) task inside the 10-minute cooldown window
// is returned instead of creating a duplicate; terminal tasks never block a
// new alert. The per-sequence dedupe key keeps concurrent clicks safe (the
// loser refetches the winner's task).
async function createOrReuseTask(
  caseId: string,
  senderId: string,
  recipientUserId: string,
  now: Date,
): Promise<UrgentTaskView> {
  const existing = await prisma.notificationTask.findFirst({
    where: {
      caseId,
      kind: "peer_urgent",
      recipientUserId,
      status: { in: [...URGENT_OPEN_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing && isUrgentInCooldown(existing.createdAt, now)) {
    return { ...toUrgentView(existing), deduped: true };
  }

  const prefix = `peer_urgent:${caseId}:${recipientUserId}:`;
  const seq =
    (await prisma.notificationTask.count({ where: { dedupeKey: { startsWith: prefix } } })) + 1;
  const channel = await pickEmailChannel(prisma, recipientUserId);
  try {
    // REQ-NTF-12: no usable channel still leaves a visible, failed record —
    // the sender sees it immediately in the response.
    const created = await prisma.notificationTask.create({
      data: {
        kind: "peer_urgent",
        caseId,
        senderUserId: senderId,
        recipientUserId,
        recipientChannelId: channel?.id ?? null,
        status: channel ? "queued" : "failed",
        lastError: channel ? null : "no_channel",
        dedupeKey: peerUrgentDedupeKey(caseId, recipientUserId, seq),
      },
    });
    return { ...toUrgentView(created), deduped: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.notificationTask.findFirst({
        where: {
          caseId,
          kind: "peer_urgent",
          recipientUserId,
          status: { in: [...URGENT_OPEN_STATUSES] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (winner) return { ...toUrgentView(winner), deduped: true };
    }
    throw error;
  }
}

function toUrgentView(task: {
  id: string;
  recipientUserId: string;
  status: string;
  lastError: string | null;
}) {
  return {
    id: task.id,
    recipientUserId: task.recipientUserId,
    status: task.status,
    lastError: task.lastError,
  };
}

// REQ-NTF-01/02: the sender must be an active member (403 otherwise, archived
// case 409); every recipient must be an active member of the same case.
export async function sendUrgentAlerts(
  caseId: string,
  actor: User,
  body: Record<string, unknown>,
  now: Date = new Date(),
): Promise<{ tasks: UrgentTaskView[] }> {
  await requireCaseMember(caseId, actor);
  await requireWritableCase(caseId);
  const recipientIds = parseRecipientIds(body);
  const activeMembers = await prisma.caseMember.findMany({
    where: { caseId, userId: { in: recipientIds }, status: "active" },
    select: { userId: true },
  });
  if (activeMembers.length !== recipientIds.length) {
    throw new ApiError(400, "invalid_recipient");
  }
  await recordAudit(prisma, {
    actorId: actor.id,
    action: "urgent.send",
    result: "success",
    caseId,
    meta: { recipientCount: recipientIds.length },
  });
  const tasks: UrgentTaskView[] = [];
  for (const recipientUserId of recipientIds) {
    tasks.push(await createOrReuseTask(caseId, actor.id, recipientUserId, now));
  }
  return { tasks };
}

// REQ-NTF-04: delivery status (including final failure and in-app
// confirmation) is visible to the sender. Views carry display names only —
// never contact channels (REQ-PM-09).
export async function listSentUrgentAlerts(caseId: string, user: User) {
  await requireCaseMember(caseId, user);
  const tasks = await prisma.notificationTask.findMany({
    where: { caseId, kind: "peer_urgent", senderUserId: user.id },
    include: { recipientUser: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return tasks.map((task) => ({
    id: task.id,
    recipientUserId: task.recipientUserId,
    recipientDisplayName: task.recipientUser.displayName,
    status: task.status,
    attempts: task.attempts,
    lastError: task.lastError,
    createdAt: task.createdAt,
    submittedAt: task.submittedAt,
    confirmedAt: task.confirmedAt,
    cancelledAt: task.cancelledAt,
  }));
}

// The recipient's own inbox of peer urgent alerts, across their cases.
export async function listIncomingUrgentAlerts(user: User) {
  const tasks = await prisma.notificationTask.findMany({
    where: { recipientUserId: user.id, kind: "peer_urgent" },
    include: { sender: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return tasks.map((task) => ({
    id: task.id,
    kind: task.kind,
    caseId: task.caseId,
    senderDisplayName: task.sender?.displayName ?? null,
    status: task.status,
    createdAt: task.createdAt,
    confirmedAt: task.confirmedAt,
  }));
}

// REQ-NTF-06: only the addressed recipient may confirm; the time is recorded
// on the task (visible to the sender). Terminal failed/cancelled tasks can no
// longer be confirmed; re-confirming keeps the first timestamp.
export async function confirmUrgentAlert(
  taskId: string,
  user: User,
  now: Date = new Date(),
) {
  if (!UUID_RE.test(taskId)) throw new ApiError(404, "not_found");
  const task = await prisma.notificationTask.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "not_found");
  if (task.recipientUserId !== user.id) throw new ApiError(403, "forbidden");
  if (task.kind !== "peer_urgent") throw new ApiError(400, "invalid_kind");
  if (task.status === "failed" || task.status === "cancelled") {
    throw new ApiError(409, "invalid_state");
  }
  if (task.status !== "in_app_confirmed") {
    await prisma.notificationTask.update({
      where: { id: task.id },
      data: { status: "in_app_confirmed", confirmedAt: now },
    });
  }
  const current = await prisma.notificationTask.findUniqueOrThrow({ where: { id: task.id } });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "urgent.confirm",
    result: "success",
    targetType: "notification_task",
    targetId: task.id,
    caseId: task.caseId,
  });
  return {
    id: current.id,
    caseId: current.caseId,
    status: current.status,
    confirmedAt: current.confirmedAt,
  };
}
