import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as listMessages, POST as sendMessage } from "@/app/api/cases/[id]/messages/route";
import { POST as approveTask } from "@/app/api/review/tasks/[id]/approve/route";
import { GET as listReviewTasks } from "@/app/api/review/tasks/route";
import { prisma } from "@/lib/db";
import { setMessageCheckerForTests } from "@/modules/messages/check";
import {
  ESCALATE_TO_BACKUP_MS,
  ESCALATE_TO_OPS_MS,
  runNotificationWorkerOnce,
} from "@/server/jobs/worker";
import { fakeEmailProvider } from "@/server/providers/email/fake";
import type { EmailProvider } from "@/server/providers/email/interface";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  postMessage,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function fakeClock(start: Date) {
  let t = start.getTime();
  return {
    clock: { now: () => new Date(t) },
    advance(ms: number) {
      t += ms;
    },
  };
}

async function seedChat() {
  const { kase, coordinator, cookie } = await seedCaseWithCoordinator("Alert Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-alerts@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  return { kase, coordinator, cookie, lawyer, lawyerCookie };
}

async function sendHeld(caseId: string, cookie: string, key: string, text = "这个案件你们律所收费多少？") {
  const res = await sendMessage(
    postMessage(caseId, cookie, { sourceText: text }, { "idempotency-key": key }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  const message = (await res.json()).message as Record<string, unknown>;
  expect(message.status).toBe("pending_review");
  return message;
}

async function queueFor(cookie: string) {
  const res = await listReviewTasks(sendJson("GET", "/api/review/tasks", {}, cookieHeader(cookie)));
  expect(res.status).toBe(200);
  return (await res.json()).tasks as Array<Record<string, unknown>>;
}

describe("review alert lifecycle (REQ-NTF-07~13)", () => {
  beforeEach(async () => {
    await resetDatabase();
    setMessageCheckerForTests({ check: async () => "needs_review" });
  });
  afterEach(() => {
    setMessageCheckerForTests();
  });

  it("registers one alert per reviewer in the same transaction as the hold", async () => {
    const { kase, coordinator, lawyerCookie } = await seedChat();
    await sendHeld(kase.id, lawyerCookie, "al-reg-1");

    const alerts = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.kind).toBe("review_alert");
    expect(alerts[0]!.recipientUserId).toBe(coordinator.id);
    expect(alerts[0]!.recipientChannelId).not.toBeNull();
    expect(alerts[0]!.status).toBe("queued");
    expect(alerts[0]!.reviewTaskId).not.toBeNull();
    // Nothing is sent until the worker runs.
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("rolls back alerts with the hold when task registration fails mid-transaction", async () => {
    const { kase, lawyerCookie } = await seedChat();
    setMessageCheckerForTests({
      check: async () => ({ outcome: "needs_review" as const, reason: "x".repeat(500) }),
    });
    const res = await sendMessage(
      postMessage(kase.id, lawyerCookie, { sourceText: "held" }, { "idempotency-key": "al-rb-1" }),
      params(kase.id),
    );
    const message = (await res.json()).message as Record<string, unknown>;
    expect(message.status).toBe("check_failed");
    expect(await prisma.reviewTask.count()).toBe(0);
    expect(await prisma.notificationTask.count()).toBe(0);
  });

  it("skips the author when another reviewer exists and notifies the others", async () => {
    const { kase, coordinator, cookie } = await seedChat();
    const { user: second } = await createVerifiedUser("coordinator", "coordinator2@example.com");
    await addMember(kase.id, second.id, "coordinator");

    await sendHeld(kase.id, cookie, "al-skip-1");
    const alerts = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(alerts.map((a) => a.recipientUserId)).toEqual([second.id]);
    expect(alerts[0]!.recipientUserId).not.toBe(coordinator.id);
  });

  it("still notifies the author when they are the sole reviewer without a backup", async () => {
    const { kase, coordinator, cookie } = await seedChat();
    await sendHeld(kase.id, cookie, "al-sole-1");
    const alerts = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(alerts.map((a) => a.recipientUserId)).toEqual([coordinator.id]);
    expect(alerts[0]!.status).toBe("queued");
  });

  it("completes the first submission attempt within 30 seconds (simulated clock)", async () => {
    const { kase, coordinator, lawyerCookie } = await seedChat();
    const { clock, advance } = fakeClock(new Date());
    await sendHeld(kase.id, lawyerCookie, "al-fast-1");

    advance(25_000);
    await runNotificationWorkerOnce({ clock });

    const alert = await prisma.notificationTask.findFirstOrThrow({ where: { caseId: kase.id } });
    expect(alert.status).toBe("submitted");
    expect(alert.attempts).toBe(1);
    expect(alert.submittedAt!.getTime() - alert.createdAt.getTime()).toBeLessThanOrEqual(30_000);
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.to).toBe("coordinator1@example.com");
    expect(coordinator.id).toBe(alert.recipientUserId);
  });

  it("retries at 1/5/15 minutes, waits for next_retry_at, and fails visibly after 5 attempts", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const { clock, advance } = fakeClock(new Date());
    const t0 = clock.now().getTime();
    await sendHeld(kase.id, lawyerCookie, "al-retry-1");

    let calls = 0;
    const failing: EmailProvider = {
      send: async () => {
        calls += 1;
        return { accepted: false };
      },
    };
    const alertId = () =>
      prisma.notificationTask.findFirstOrThrow({ where: { caseId: kase.id } });

    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    let alert = await alertId();
    expect(calls).toBe(1);
    expect(alert.attempts).toBe(1);
    expect(alert.status).toBe("queued");
    expect(alert.nextRetryAt!.getTime() - t0).toBe(60_000);

    // Not due yet: an early pass must not re-attempt.
    advance(30_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    expect(calls).toBe(1);

    advance(30_000); // t+1min
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    alert = await alertId();
    expect(alert.attempts).toBe(2);
    expect(alert.nextRetryAt!.getTime() - t0).toBe(60_000 + 5 * 60_000);

    advance(5 * 60_000); // t+6min
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    alert = await alertId();
    expect(alert.attempts).toBe(3);
    expect(alert.nextRetryAt!.getTime() - t0).toBe(60_000 + 5 * 60_000 + 15 * 60_000);

    advance(15 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    alert = await alertId();
    expect(alert.attempts).toBe(4);

    advance(15 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    alert = await alertId();
    expect(calls).toBe(5);
    expect(alert.attempts).toBe(5);
    expect(alert.status).toBe("failed");
    expect(alert.lastError).toBe("provider_rejected");

    // Final failure is terminal: later passes never retry it.
    advance(60 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    expect(calls).toBe(5);
  });

  it("merges consecutive holds into one batch email without losing any item", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const { clock } = fakeClock(new Date());
    await sendHeld(kase.id, lawyerCookie, "al-batch-1");
    await sendHeld(kase.id, lawyerCookie, "al-batch-2");

    await runNotificationWorkerOnce({ clock });

    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.text).toContain("2 项");
    const alerts = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(alerts).toHaveLength(2);
    expect(alerts.every((a) => a.status === "submitted")).toBe(true);
    // Each pending item keeps its independent task and alert record.
    expect(new Set(alerts.map((a) => a.reviewTaskId)).size).toBe(2);
  });

  it("escalates to the backup coordinator at 30 minutes and the operations lead at 2 hours, never auto-releasing", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const { user: backup } = await createVerifiedUser("coordinator", "backup@example.com");
    await addMember(kase.id, backup.id, "coordinator", {
      canManage: false,
      canReview: false,
      isBackup: true,
    });
    await createVerifiedUser("ops_lead", "ops-lead@example.com");

    const { clock, advance } = fakeClock(new Date());
    const message = await sendHeld(kase.id, lawyerCookie, "al-esc-1");
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetId: message.id as string },
    });

    await runNotificationWorkerOnce({ clock });
    expect(fakeEmailProvider.outbox.map((m) => m.to)).toEqual(["coordinator1@example.com"]);

    advance(ESCALATE_TO_BACKUP_MS + 60_000);
    await runNotificationWorkerOnce({ clock });
    let current = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(current.escalationLevel).toBe(1);
    expect(fakeEmailProvider.outbox.map((m) => m.to)).toEqual([
      "coordinator1@example.com",
      "backup@example.com",
    ]);

    advance(ESCALATE_TO_OPS_MS - ESCALATE_TO_BACKUP_MS);
    await runNotificationWorkerOnce({ clock });
    current = await prisma.reviewTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(current.escalationLevel).toBe(2);
    expect(fakeEmailProvider.outbox.map((m) => m.to)).toContain("ops-lead@example.com");

    // No timeout ever auto-releases the content.
    const held = await prisma.message.findUniqueOrThrow({ where: { id: message.id as string } });
    expect(held.status).toBe("pending_review");
    expect(held.publishedAt).toBeNull();
    expect(current.status).toBe("open");
  });

  it("cancels unsent alerts when the review completes", async () => {
    const { kase, cookie, lawyerCookie } = await seedChat();
    const message = await sendHeld(kase.id, lawyerCookie, "al-cancel-1");
    const task = await prisma.reviewTask.findFirstOrThrow({
      where: { targetId: message.id as string },
    });

    const res = await approveTask(
      sendJson("POST", `/api/review/tasks/${task.id}/approve`, {}, cookieHeader(cookie)),
      params(task.id),
    );
    expect(res.status).toBe(200);

    const alerts = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.status).toBe("cancelled");
    expect(alerts[0]!.cancelledAt).not.toBeNull();

    await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("re-checks coordinator permission before sending: a revoked reviewer is not emailed", async () => {
    const { kase, coordinator, lawyerCookie } = await seedChat();
    await sendHeld(kase.id, lawyerCookie, "al-revoke-1");
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: coordinator.id } },
      data: { canReview: false, canManage: false },
    });

    const summary = await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(0);
    const alert = await prisma.notificationTask.findFirstOrThrow({ where: { caseId: kase.id } });
    expect(alert.status).toBe("cancelled");
    expect(alert.lastError).toBe("permission_revoked");
    expect(summary.cancelled).toBeGreaterThan(0);
  });

  it("marks the alert failed and surfaces the anomaly when no valid channel exists", async () => {
    const { kase, coordinator } = await seedChat();
    // coordinator1 keeps can_manage but drops can_review; the only reviewer
    // has no registered channel at all.
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: coordinator.id } },
      data: { canReview: false },
    });
    const channelLess = await prisma.user.create({
      data: { displayName: "nochannel", globalRole: "coordinator" },
    });
    await addMember(kase.id, channelLess.id, "coordinator", { canManage: false });
    const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-nochan@example.com");
    await addMember(kase.id, lawyer.id, "lawyer");
    const lawyerCookie = await sessionCookieFor(lawyer.id);

    const message = await sendHeld(kase.id, lawyerCookie, "al-nochan-1");
    // The submitter sees the anomaly immediately on the send response…
    expect(message.reviewAlertIssue).toBe(true);

    const alert = await prisma.notificationTask.findFirstOrThrow({ where: { caseId: kase.id } });
    expect(alert.status).toBe("failed");
    expect(alert.lastError).toBe("no_channel");
    expect(alert.recipientChannelId).toBeNull();

    // …and on their message list…
    const listRes = await listMessages(
      sendJson("GET", `/api/cases/${kase.id}/messages`, {}, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    const listed = (await listRes.json()).messages as Array<Record<string, unknown>>;
    expect(listed).toHaveLength(1);
    expect(listed[0]!.reviewAlertIssue).toBe(true);

    // …and the reviewer sees it flagged in the queue (backend visibility).
    const noChannelCookie = await sessionCookieFor(channelLess.id);
    const tasks = await queueFor(noChannelCookie);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.alertIssue).toBe(true);
  });

  it("keeps the notification body free of the original message, fees, and contact addresses", async () => {
    const { kase, lawyerCookie } = await seedChat();
    const sourceText = "这个案件你们律所收费多少？五十万能不能少？";
    await sendHeld(kase.id, lawyerCookie, "al-body-1", sourceText);

    await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    const email = fakeEmailProvider.outbox[0]!;
    expect(email.to).toBe("coordinator1@example.com");
    expect(email.text).not.toContain(sourceText);
    expect(email.text).not.toContain("收费");
    expect(email.text).not.toContain("五十万");
    expect(email.text).not.toContain("lawyer-alerts@example.com");
    expect(email.text).not.toContain("@");
    expect(email.text).toContain("待审核");
    expect(email.text).toContain("/review");
  });
});
