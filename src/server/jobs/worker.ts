import { decryptText } from "@/modules/auth/crypto";
import {
  buildDigestPartEmail,
  generateDigestsForDate,
  refreshDigestRunStatus,
} from "@/modules/digest/service";
import { parseDigestDedupeKey } from "@/modules/digest/subject";
import {
  MAX_NOTIFICATION_ATTEMPTS,
  backoffDelayMs,
  groupAlertsIntoBatches,
} from "@/modules/notifications/dedupe";
import {
  buildCheckFailedAlertEmail,
  buildPeerUrgentEmail,
  buildReviewAlertEmail,
  buildUrgentFailedAlertEmail,
} from "@/modules/notifications/templates";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { getEmailProvider } from "@/server/providers/email";
import type { EmailProvider } from "@/server/providers/email/interface";

import { systemClock, type Clock } from "./clock";
import { registerEscalationAlerts, registerUrgentFailedNotices } from "./queue";

// REQ-NTF-11 [O03]: escalate to the backup coordinator after 30 minutes
// unpicked, to the operations lead after 2 hours unhandled — elapsed clock
// time only, no business-hours calendar. No timeout ever auto-releases.
export const ESCALATE_TO_BACKUP_MS = 30 * 60_000;
export const ESCALATE_TO_OPS_MS = 2 * 60 * 60_000;

export interface NotificationWorkerDeps {
  clock?: Clock;
  emailProvider?: EmailProvider;
  // REQ-DIG-01: opt-in daily digest generation. Default false so tests that
  // drive this worker with simulated clocks never generate digests
  // unintentionally; the runtime loop (startNotificationWorker) opts in.
  digest?: boolean;
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

  if (deps.digest) {
    // Idempotent via the unique (case_id, digest_date): a failure here is
    // retried by the next pass, so it must not block the alert queue.
    try {
      await generateDigestsForDate(clock.now());
    } catch {
      // The next tick replays generation; nothing is lost.
    }
  }
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
      kind: { in: ["review_alert", "check_failed_alert", "peer_urgent", "urgent_failed_alert", "case_digest"] },
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
  // case_digest is exempt from batching: every part is its own email with its
  // own attachments (REQ-DIG-05), so each task is submitted on its own.
  const byKind = new Map<string, DueAlert[]>();
  for (const alert of sendable) {
    const group = byKind.get(alert.kind);
    if (group) group.push(alert);
    else byKind.set(alert.kind, [alert]);
  }
  for (const [kind, alerts] of byKind) {
    if (kind === "case_digest") {
      for (const alert of alerts) {
        await submitDigestTask(alert, clock, emailProvider, summary);
      }
      continue;
    }
    for (const batch of groupAlertsIntoBatches(alerts).values()) {
      await submitBatch(kind, batch, clock, emailProvider, summary);
    }
  }
}

// REQ-NTF-13: re-validate the review task, the case, the recipient's
// permission, and the channel immediately before sending. peer_urgent
// recipients only need an active membership (any role); the coordinator
// alerts require the reviewer/backup duty flags (or an active ops lead).
// case_digest recipients are ALL active coordinator members (REQ-DIG-02) —
// the duty flags do not gate the daily digest.
async function preSendRecheck(
  alert: {
    id: string;
    kind: string;
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
    alert.kind === "peer_urgent"
      ? (await prisma.caseMember.findFirst({
          where: { caseId: alert.caseId, userId: alert.recipientUserId, status: "active" },
        })) !== null
      : alert.kind === "case_digest"
        ? (await prisma.caseMember.findFirst({
            where: {
              caseId: alert.caseId,
              userId: alert.recipientUserId,
              status: "active",
              memberRole: "coordinator",
            },
          })) !== null
        : alert.recipientUser.globalRole === "ops_lead"
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
    recipientUser: { preferredLang: string | null; uiLang: string | null };
  }>,
  clock: Clock,
  emailProvider: EmailProvider,
  summary: WorkerRunSummary,
): Promise<void> {
  const first = batch[0]!;
  const now = clock.now();
  // REQ-FILE-08 / REQ-NTF-01: alert emails carry only neutral wording and a
  // non-sensitive reference — never message bodies, file names, case titles,
  // or anyone's contact address. peer_urgent uses the recipient's language.
  const email = await buildEmailForKind(kind, first);
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
      // Final failure stays visible (REQ-NTF-05/12); a failed peer urgent
      // alert also notifies the case's can_review coordinators, content-free.
      summary.failed += 1;
      await prisma.notificationTask.update({
        where: { id: alert.id },
        data: { status: "failed", attempts, lastError: "provider_rejected" },
      });
      if (kind === "peer_urgent") {
        await registerUrgentFailedNotices({ caseId: alert.caseId, peerTaskId: alert.id });
      }
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

async function buildEmailForKind(
  kind: string,
  first: {
    id: string;
    caseId: string;
    reviewTaskId: string | null;
    recipientUser: { preferredLang: string | null; uiLang: string | null };
  },
): Promise<{ subject: string; text: string }> {
  if (kind === "check_failed_alert") {
    return buildCheckFailedAlertEmail({ alertRef: first.id, baseUrl: BASE_URL });
  }
  if (kind === "peer_urgent") {
    return buildPeerUrgentEmail({
      lang: first.recipientUser.preferredLang ?? first.recipientUser.uiLang,
      taskRef: first.id,
      caseId: first.caseId,
      baseUrl: BASE_URL,
    });
  }
  if (kind === "urgent_failed_alert") {
    return buildUrgentFailedAlertEmail({ alertRef: first.id, baseUrl: BASE_URL });
  }
  return buildReviewAlertEmail({
    pendingCount: await prisma.reviewTask.count({
      where: { caseId: first.caseId, status: "open" },
    }),
    taskRef: first.reviewTaskId ?? first.id,
    baseUrl: BASE_URL,
  });
}

// REQ-DIG-05/06: one digest part task = one email. The body comes from the
// frozen digest_runs row, attachments are the part's published shared copies,
// and every successful send is audited (never the content). Final failure
// stays visible on both the task and the digest run; the recipient is the
// coordinator themselves, so no extra alert email is registered.
async function submitDigestTask(
  alert: {
    id: string;
    caseId: string;
    dedupeKey: string;
    attempts: number;
    case: { title: string };
    recipientChannel: { valueEnc: string } | null;
    recipientUserId: string;
  },
  clock: Clock,
  emailProvider: EmailProvider,
  summary: WorkerRunSummary,
): Promise<void> {
  const now = clock.now();
  const parsed = parseDigestDedupeKey(alert.dedupeKey);
  const run = parsed
    ? await prisma.digestRun.findUnique({
        where: {
          caseId_digestDate: { caseId: parsed.caseId, digestDate: parsed.digestDate },
        },
      })
    : null;

  let email: { subject: string; text: string; attachments?: { filename: string; content: Buffer }[] } | null = null;
  let lastError = "provider_rejected";
  if (run && parsed) {
    try {
      email = await buildDigestPartEmail({ caseTitle: alert.case.title, run, part: parsed.part });
    } catch {
      email = null;
      lastError = "digest_build_failed";
    }
  } else {
    lastError = "digest_run_missing";
  }

  let accepted = false;
  if (email) {
    try {
      accepted = (
        await emailProvider.send({ to: decryptText(alert.recipientChannel!.valueEnc), ...email })
      ).accepted;
    } catch {
      accepted = false;
    }
  }

  if (accepted && run && parsed) {
    summary.submitted += 1;
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: {
        status: "submitted",
        submittedAt: now,
        attempts: { increment: 1 },
        providerRef: "fake-outbox",
        lastError: null,
        nextRetryAt: null,
      },
    });
    await recordAudit(prisma, {
      actorId: alert.recipientUserId,
      action: "digest.send",
      result: "success",
      targetType: "digest_run",
      targetId: run.id,
      caseId: alert.caseId,
      meta: { digestDate: run.digestDate, part: parsed.part, parts: run.parts },
    });
    await refreshDigestRunStatus(run, null);
    return;
  }

  const attempts = alert.attempts + 1;
  const delay = backoffDelayMs(attempts);
  if (delay === null || attempts >= MAX_NOTIFICATION_ATTEMPTS) {
    summary.failed += 1;
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { status: "failed", attempts, lastError },
    });
    if (run) await refreshDigestRunStatus(run, lastError);
  } else {
    summary.retried += 1;
    await prisma.notificationTask.update({
      where: { id: alert.id },
      data: { attempts, nextRetryAt: new Date(now.getTime() + delay), lastError },
    });
  }
}

// Dev-runtime driver: first attempt well inside the 30-second internal
// target (REQ-NTF-07). Tests drive runNotificationWorkerOnce directly with a
// simulated clock instead.
export function startNotificationWorker(intervalMs = 10_000): () => void {
  const tick = () => {
    // digest: the in-process worker also generates the daily case digest
    // (REQ-DIG-01); idempotent, so 10s ticks and restarts are safe.
    runNotificationWorkerOnce({ digest: true }).catch(() => {
      // The next tick replays the persistent queue; nothing is lost.
    });
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
