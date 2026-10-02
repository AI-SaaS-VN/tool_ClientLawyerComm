import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  reviewAlertDedupeKey,
  selectReviewAlertRecipients,
} from "@/modules/notifications/dedupe";

type DbTx = Prisma.TransactionClient;

// Active coordinator memberships that count as reviewers (can_review) or as
// configured backup coordinators (REQ-NTF-11 escalation target).
async function loadReviewersAndBackups(
  tx: DbTx,
  caseId: string,
): Promise<{ reviewers: string[]; backups: string[] }> {
  const members = await tx.caseMember.findMany({
    where: {
      caseId,
      status: "active",
      memberRole: "coordinator",
      OR: [{ canReview: true }, { isBackup: true }],
    },
  });
  return {
    reviewers: members.filter((m) => m.canReview).map((m) => m.userId),
    backups: members.filter((m) => m.isBackup).map((m) => m.userId),
  };
}

async function pickEmailChannel(tx: DbTx, userId: string) {
  return tx.contactChannel.findFirst({
    where: { userId, type: "email", verifiedAt: { not: null }, notifyEnabled: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

// One notification_tasks row per recipient, idempotent on the dedupe key.
// Existing keys are filtered BEFORE createMany: a unique-violation inside an
// interactive transaction would abort it (and with it the review hold).
async function createAlertRows(
  tx: DbTx,
  input: {
    caseId: string;
    reviewTaskId: string | null;
    kind: string;
    level: number;
    recipientUserIds: string[];
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) return;
  const keys = input.recipientUserIds.map((userId) =>
    reviewAlertDedupeKey(input.reviewTaskId ?? "none", userId, input.level),
  );
  const existing = await tx.notificationTask.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const taken = new Set(existing.map((row) => row.dedupeKey));
  const rows: Prisma.NotificationTaskCreateManyInput[] = [];
  for (const [index, userId] of input.recipientUserIds.entries()) {
    const dedupeKey = keys[index]!;
    if (taken.has(dedupeKey)) continue;
    const channel = await pickEmailChannel(tx, userId);
    // REQ-NTF-12: no valid channel still leaves a visible, failed record.
    rows.push({
      kind: input.kind,
      caseId: input.caseId,
      reviewTaskId: input.reviewTaskId,
      recipientUserId: userId,
      recipientChannelId: channel?.id ?? null,
      status: channel ? "queued" : "failed",
      lastError: channel ? null : "no_channel",
      dedupeKey,
    });
  }
  if (rows.length > 0) await tx.notificationTask.createMany({ data: rows });
}

// REQ-NTF-07: called inside the holdForReview transaction so the hold, the
// review task, and one alert per recipient commit or roll back together.
export async function registerHoldAlerts(
  tx: DbTx,
  input: { caseId: string; reviewTaskId: string; authorId: string },
): Promise<void> {
  const { reviewers, backups } = await loadReviewersAndBackups(tx, input.caseId);
  const { recipientIds } = selectReviewAlertRecipients({
    reviewers,
    backups,
    authorId: input.authorId,
  });
  await createAlertRows(tx, {
    caseId: input.caseId,
    reviewTaskId: input.reviewTaskId,
    kind: "review_alert",
    level: 0,
    recipientUserIds: recipientIds,
  });
}

// REQ-NTF-11 escalation: the worker re-targets alerts at backup coordinators
// (level 1) or operations leads (level 2) after the timeout thresholds.
export async function registerEscalationAlerts(input: {
  caseId: string;
  reviewTaskId: string;
  level: 1 | 2;
}): Promise<number> {
  const recipientUserIds =
    input.level === 1
      ? (
          await prisma.caseMember.findMany({
            where: { caseId: input.caseId, status: "active", memberRole: "coordinator", isBackup: true },
            select: { userId: true },
          })
        ).map((m) => m.userId)
      : (
          await prisma.user.findMany({
            where: { globalRole: "ops_lead", status: "active" },
            select: { id: true },
          })
        ).map((u) => u.id);
  await prisma.$transaction(async (tx) => {
    await createAlertRows(tx, {
      caseId: input.caseId,
      reviewTaskId: input.reviewTaskId,
      kind: "review_alert",
      level: input.level,
      recipientUserIds,
    });
  });
  return recipientUserIds.length;
}

// REQ-FILE-08 / REQ-NTF-05: entering check_failed registers one content-free
// alert per reviewer in the same transaction as the state change. Recipients
// are the case's can_review coordinators minus the author (backups only when
// no reviewer remains, mirroring REQ-NTF-07). The dedupe key carries a
// per-failure sequence so a failed scan-retry alerts again exactly once.
export async function registerCheckFailedAlerts(
  tx: DbTx,
  input: { caseId: string; targetId: string; authorId: string },
): Promise<void> {
  const { reviewers, backups } = await loadReviewersAndBackups(tx, input.caseId);
  const reviewerOthers = reviewers.filter((id) => id !== input.authorId);
  const recipientIds =
    reviewerOthers.length > 0
      ? reviewerOthers
      : backups.filter((id) => id !== input.authorId);
  for (const userId of recipientIds) {
    const prefix = `check_failed_alert:${input.targetId}:${userId}:`;
    const seq = (await tx.notificationTask.count({
      where: { dedupeKey: { startsWith: prefix } },
    })) + 1;
    const channel = await pickEmailChannel(tx, userId);
    // REQ-NTF-12: no valid channel still leaves a visible, failed record.
    await tx.notificationTask.create({
      data: {
        kind: "check_failed_alert",
        caseId: input.caseId,
        recipientUserId: userId,
        recipientChannelId: channel?.id ?? null,
        status: channel ? "queued" : "failed",
        lastError: channel ? null : "no_channel",
        dedupeKey: `${prefix}${seq}`,
      },
    });
  }
}

// REQ-NTF-13: completing a review cancels its unsent (queued) alerts.
export async function cancelQueuedAlertsForReviewTask(
  tx: DbTx,
  reviewTaskId: string,
  now: Date,
): Promise<void> {
  await tx.notificationTask.updateMany({
    where: { reviewTaskId, status: "queued" },
    data: { status: "cancelled", cancelledAt: now },
  });
}

// REQ-NTF-12 anomaly detection: an open review task with no alert pending or
// sent (all failed/cancelled, or none registered) means nobody is coming.
export async function listAlertIssueReviewTaskIds(reviewTaskIds: string[]): Promise<Set<string>> {
  const issueIds = new Set(reviewTaskIds);
  if (reviewTaskIds.length === 0) return issueIds;
  const covered = await prisma.notificationTask.findMany({
    where: { reviewTaskId: { in: reviewTaskIds }, status: { in: ["queued", "submitted"] } },
    select: { reviewTaskId: true },
  });
  for (const row of covered) {
    if (row.reviewTaskId) issueIds.delete(row.reviewTaskId);
  }
  return issueIds;
}
