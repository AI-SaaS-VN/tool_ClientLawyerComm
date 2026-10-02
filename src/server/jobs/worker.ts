import { decryptText } from "@/modules/auth/crypto";
import {
  MAX_NOTIFICATION_ATTEMPTS,
  backoffDelayMs,
  groupAlertsIntoBatches,
} from "@/modules/notifications/dedupe";
import { buildCheckFailedAlertEmail, buildReviewAlertEmail } from "@/modules/notifications/templates";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/server/providers/email";
import type { EmailProvider } from "@/server/providers/email/interface";

import { systemClock, type Clock } from "./clock";
import { registerEscalationAlerts } from "./queue";

// REQ-NTF-11 [O03]: escalate to the backup coordinator after 30 minutes
// unpicked, to the operations lead after 2 hours unhandled — elapsed clock
// time only, no business-hours calendar. No timeout ever auto-releases.
export const ESCALATE_TO_BACKUP_MS = 30 * 60_000;
export const ESCALATE_TO_OPS_MS = 2 * 60 * 60_000;

export interface NotificationWorkerDeps {
  clock?: Clock;
  emailProvider?: EmailProvider;
}

export interface WorkerRunSummary {
  cancelled: number;
  escalated: number;
  submitted: number;
  retried: number;
  failed: number;
}

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

// One pass of the persistent queue: cancel stale alerts, advance escalation,
// then send what is due. Every pass is idempotent, so replaying after a
// crash re-drives queued tasks from the database (at-least-once delivery).
export async function runNotificationWorkerOnce(
  deps: NotificationWorkerDeps = {},
): Promise<WorkerRunSummary> {
  const clock = deps.clock ?? systemClock;
  const emailProvider = deps.emailProvider ?? getEmailProvider();
  const summary: WorkerRunSummary = { cancelled: 0, escalated: 0, submitted: 0, retried: 0, failed: 0 };

  summary.cancelled += await cancelStaleAlerts(clock.now());
  summary.escalated += await advanceEscalations(clock.now());
  await sendDueAlerts(clock, emailProvider, summary);
  return summary;
}

// REQ-NTF-13 / REQ-OPS-03: queued alerts whose review task was decided or
// whose case was archived must never be sent.
async function cancelStaleAlerts(now: Date): Promise<number> {
  const result = await prisma.notificationTask.updateMany({
    where: {
      status: "queued",
      OR: [{ reviewTask: { status: { not: "open" } } }, { case: { status: { not: "active" } } }],
    },
    data: { status: "cancelled", cancelledAt: now },
  });
  return result.count;
}

async function advanceEscalations(now: Date): Promise<number> {
  let escalated = 0;
  const toBackup = await prisma.reviewTask.findMany({
    where: {
      status: "open",
      escalationLevel: 0,
      createdAt: { lte: new Date(now.getTime() - ESCALATE_TO_BACKUP_MS) },
      case: { status: "active" },
    },
    select: { id: true, caseId: true },
  });
  for (const task of toBackup) {
    await prisma.reviewTask.update({ where: { id: task.id }, data: { escalationLevel: 1 } });
    await registerEscalationAlerts({ caseId: task.caseId, reviewTaskId: task.id, level: 1 });
    escalated += 1;
  }
  const toOps = await prisma.reviewTask.findMany({
    where: {
      status: "open",
      escalationLevel: 1,
      createdAt: { lte: new Date(now.getTime() - ESCALATE_TO_OPS_MS) },
      case: { status: "active" },
    },
    select: { id: true, caseId: true },
  });
  for (const task of toOps) {
    await prisma.reviewTask.update({ where: { id: task.id }, data: { escalationLevel: 2 } });
    await registerEscalationAlerts({ caseId: task.caseId, reviewTaskId: task.id, level: 2 });
    escalated += 1;
  }
  return escalated;
}

async function sendDueAlerts(
  clock: Clock,
  emailProvider: EmailProvider,
  summary: WorkerRunSummary,
): Promise<void> {
  const now = clock.now();
  const due = await prisma.notificationTask.findMany({
    where: {
      kind: { in: ["review_alert", "check_failed_alert"] },
      status: "queued",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    include: { reviewTask: true, case: true, recipientChannel: true, recipientUser: true },
    orderBy: { createdAt: "asc" },
  });

  type DueAlert = (typeof due)[number];
  const sendable: DueAlert[] = [];
  for (const alert of due) {
    const verdict = await preSendRecheck(alert, now);
    if (verdict === "send") sendable.push(alert);
    else if (verdict === "cancel") summary.cancelled += 1;
    else summary.failed += 1;
  }

  // Batches are per (kind, case, recipient): each kind has its own template.
  const byKind = new Map<string, DueAlert[]>();
  for (const alert of sendable) {
    const group = byKind.get(alert.kind);
    if (group) group.push(alert);
    else byKind.set(alert.kind, [alert]);
  }
  for (const [kind, alerts] of byKind) {
    for (const batch of groupAlertsIntoBatches(alerts).values()) {
      await submitBatch(kind, batch, clock, emailProvider, summary);
    }
  }
}

// REQ-NTF-13: re-validate the review task, the case, the coordinator's
// permission, and the channel immediately before sending.
async function preSendRecheck(
  alert: {
    id: string;
    recipientUserId: string;
    caseId: string;
    reviewTask: { status: string } | null;
    case: { status: string };
    recipientChannel: {
      type: string;
      verifiedAt: Date | null;
      notifyEnabled: boolean;
    } | null;
    recipientUser: { globalRole: string; status: string };
  },
  now: Date,
): Promise<"send" | "cancel" | "fail"> {
  if (alert.reviewTask && alert.reviewTask.status !== "open") {
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { status: "cancelled", cancelledAt: now, lastError: "review_completed" },
    });
    return "cancel";
  }
  if (alert.case.status !== "active") {
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { status: "cancelled", cancelledAt: now, lastError: "case_archived" },
    });
    return "cancel";
  }
  const authorized =
    alert.recipientUser.globalRole === "ops_lead"
      ? alert.recipientUser.status === "active"
      : (await prisma.caseMember.findFirst({
          where: {
            caseId: alert.caseId,
            userId: alert.recipientUserId,
            status: "active",
            memberRole: "coordinator",
            OR: [{ canReview: true }, { isBackup: true }],
          },
        })) !== null;
  if (!authorized) {
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { status: "cancelled", cancelledAt: now, lastError: "permission_revoked" },
    });
    return "cancel";
  }
  const channel = alert.recipientChannel;
  if (!channel || channel.type !== "email" || !channel.verifiedAt || !channel.notifyEnabled) {
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { status: "failed", lastError: "channel_unavailable" },
    });
    return "fail";
  }
  return "send";
}

// REQ-NTF-10: one email per (case, recipient) batch; every alert in the batch
// is marked, so a merged batch never drops a pending item.
async function submitBatch(
  kind: string,
  batch: Array<{
    id: string;
    caseId: string;
    reviewTaskId: string | null;
    attempts: number;
    recipientChannel: { valueEnc: string } | null;
  }>,
  clock: Clock,
  emailProvider: EmailProvider,
  summary: WorkerRunSummary,
): Promise<void> {
  const first = batch[0]!;
  const now = clock.now();
  // REQ-FILE-08: check_failed alerts carry no file name or content — only a
  // non-sensitive alert reference and a login-required link.
  const email =
    kind === "check_failed_alert"
      ? buildCheckFailedAlertEmail({ alertRef: first.id, baseUrl: BASE_URL })
      : buildReviewAlertEmail({
          pendingCount: await prisma.reviewTask.count({
            where: { caseId: first.caseId, status: "open" },
          }),
          taskRef: first.reviewTaskId ?? first.id,
          baseUrl: BASE_URL,
        });
  const to = decryptText(first.recipientChannel!.valueEnc);

  let accepted = false;
  try {
    accepted = (await emailProvider.send({ to, ...email })).accepted;
  } catch {
    accepted = false;
  }

  if (accepted) {
    summary.submitted += batch.length;
    await prisma.notificationTask.updateMany({
      where: { id: { in: batch.map((alert) => alert.id) } },
      data: {
        status: "submitted",
        submittedAt: now,
        attempts: { increment: 1 },
        providerRef: "fake-outbox",
        lastError: null,
        nextRetryAt: null,
      },
    });
    return;
  }

  for (const alert of batch) {
    const attempts = alert.attempts + 1;
    const delay = backoffDelayMs(attempts);
    if (delay === null || attempts >= MAX_NOTIFICATION_ATTEMPTS) {
      // Final failure stays visible (REQ-NTF-05/12).
      summary.failed += 1;
      await prisma.notificationTask.update({
        where: { id: alert.id },
        data: { status: "failed", attempts, lastError: "provider_rejected" },
      });
    } else {
      summary.retried += 1;
      await prisma.notificationTask.update({
        where: { id: alert.id },
        data: {
          attempts,
          nextRetryAt: new Date(now.getTime() + delay),
          lastError: "provider_rejected",
        },
      });
    }
  }
}

// Dev-runtime driver: first attempt well inside the 30-second internal
// target (REQ-NTF-07). Tests drive runNotificationWorkerOnce directly with a
// simulated clock instead.
export function startNotificationWorker(intervalMs = 10_000): () => void {
  const tick = () => {
    runNotificationWorkerOnce().catch(() => {
      // The next tick replays the persistent queue; nothing is lost.
    });
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
