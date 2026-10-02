import { beforeEach, describe, expect, it } from "vitest";

import { POST as archiveCase } from "@/app/api/cases/[id]/archive/route";
import { DELETE as revokeMember } from "@/app/api/cases/[id]/members/[uid]/route";
import { GET as listUrgent, POST as sendUrgent } from "@/app/api/cases/[id]/urgent/route";
import { GET as listNotifications } from "@/app/api/notifications/route";
import { prisma } from "@/lib/db";
import { runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeEmailProvider } from "@/server/providers/email/fake";
import type { EmailProvider } from "@/server/providers/email/interface";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sendJson,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function memberParams(id: string, uid: string) {
  return { params: Promise.resolve({ id, uid }) };
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

async function seedUrgentCase() {
  const { kase, coordinator, cookie: coordinatorCookie } =
    await seedCaseWithCoordinator("Urgent Case");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-urgent@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const { user: client } = await createVerifiedUser("client", "client-urgent@example.com");
  await addMember(kase.id, client.id, "client");
  const lawyerCookie = await sessionCookieFor(lawyer.id);
  const clientCookie = await sessionCookieFor(client.id);
  return { kase, coordinator, coordinatorCookie, lawyer, lawyerCookie, client, clientCookie };
}

async function postUrgent(caseId: string, cookie: string, recipientUserIds: string[]) {
  const res = await sendUrgent(
    postJson(`/api/cases/${caseId}/urgent`, { recipientUserIds }, { cookie }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  return (await res.json()).tasks as Array<Record<string, unknown>>;
}

async function sentTasks(caseId: string, cookie: string) {
  const res = await listUrgent(
    getRequest(`/api/cases/${caseId}/urgent`, cookieHeader(cookie)),
    params(caseId),
  );
  expect(res.status).toBe(200);
  return (await res.json()).tasks as Array<Record<string, unknown>>;
}

describe("peer urgent status visibility (REQ-NTF-01/03/04/05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("shows queued then submitted to the sender once the provider accepts", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    await postUrgent(kase.id, lawyerCookie, [client.id]);

    let tasks = await sentTasks(kase.id, lawyerCookie);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.status).toBe("queued");
    expect(tasks[0]!.recipientUserId).toBe(client.id);

    await runNotificationWorkerOnce({});
    tasks = await sentTasks(kase.id, lawyerCookie);
    expect(tasks[0]!.status).toBe("submitted");
    expect(tasks[0]!.submittedAt).not.toBeNull();
    expect(fakeEmailProvider.outbox).toHaveLength(1);
    expect(fakeEmailProvider.outbox[0]!.to).toBe("client-urgent@example.com");
  });

  it("keeps the email free of contact addresses, message content, and case titles", async () => {
    const { kase, lawyer, lawyerCookie, client } = await seedUrgentCase();
    await postUrgent(kase.id, lawyerCookie, [client.id]);
    await runNotificationWorkerOnce({});

    expect(fakeEmailProvider.outbox).toHaveLength(1);
    const email = fakeEmailProvider.outbox[0]!;
    expect(email.to).toBe("client-urgent@example.com");
    expect(email.text).not.toContain("@");
    expect(email.subject).not.toContain("@");
    expect(email.text).not.toContain("lawyer-urgent@example.com");
    expect(email.text).not.toContain(kase.title);
    expect(email.text).not.toContain(lawyer.displayName);
    expect(email.text).toContain("登录");
    expect(email.text).toContain("紧急");
  });

  it("uses the recipient's preferred language", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    await prisma.user.update({ where: { id: client.id }, data: { preferredLang: "vi" } });

    await postUrgent(kase.id, lawyerCookie, [client.id]);
    await runNotificationWorkerOnce({});

    const email = fakeEmailProvider.outbox[0]!;
    expect(email.text).toContain("đăng nhập");
    expect(email.text).not.toContain("登录");
  });

  it("shows the final failure to the sender and alerts can_review coordinators without content", async () => {
    const { kase, coordinator, lawyerCookie, client } = await seedUrgentCase();
    const { clock, advance } = fakeClock(new Date());
    await postUrgent(kase.id, lawyerCookie, [client.id]);

    const failing: EmailProvider = { send: async () => ({ accepted: false }) };
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    advance(60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    advance(5 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    advance(15 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });
    advance(15 * 60_000);
    await runNotificationWorkerOnce({ clock, emailProvider: failing });

    const peerTask = await prisma.notificationTask.findFirstOrThrow({
      where: { caseId: kase.id, kind: "peer_urgent" },
    });
    expect(peerTask.status).toBe("failed");
    expect(peerTask.attempts).toBe(5);
    const tasks = await sentTasks(kase.id, lawyerCookie);
    expect(tasks[0]!.status).toBe("failed");
    expect(tasks[0]!.lastError).toBe("provider_rejected");

    // REQ-NTF-05: every can_review coordinator gets a content-free notice.
    const notices = await prisma.notificationTask.findMany({
      where: { caseId: kase.id, kind: "urgent_failed_alert" },
    });
    expect(notices).toHaveLength(1);
    expect(notices[0]!.recipientUserId).toBe(coordinator.id);
    expect(notices[0]!.status).toBe("queued");

    advance(60_000);
    await runNotificationWorkerOnce({ clock });
    const noticeMail = fakeEmailProvider.outbox.find(
      (m) => m.to === "coordinator1@example.com",
    );
    expect(noticeMail).toBeDefined();
    expect(noticeMail!.text).not.toContain("@");
    expect(noticeMail!.text).not.toContain("client-urgent@example.com");
    expect(noticeMail!.text).not.toContain(kase.title);
    expect(noticeMail!.text).toContain("未能送达");

    // The coordinator notice is not re-registered on later passes.
    advance(60_000);
    await runNotificationWorkerOnce({ clock });
    expect(
      await prisma.notificationTask.count({
        where: { caseId: kase.id, kind: "urgent_failed_alert" },
      }),
    ).toBe(1);
  });

  it("marks recipients without a usable channel as failed and visible to the sender", async () => {
    const { kase, lawyerCookie } = await seedUrgentCase();
    const channelLess = await prisma.user.create({
      data: { displayName: "channelless", globalRole: "client" },
    });
    await addMember(kase.id, channelLess.id, "client");
    const { user: optedOut, channel } = await createVerifiedUser(
      "client",
      "opted-out@example.com",
    );
    await prisma.contactChannel.update({
      where: { id: channel.id },
      data: { notifyEnabled: false },
    });
    await addMember(kase.id, optedOut.id, "client");

    const tasks = await postUrgent(kase.id, lawyerCookie, [channelLess.id, optedOut.id]);
    expect(tasks).toHaveLength(2);
    for (const task of tasks) {
      expect(task.status).toBe("failed");
      expect(task.lastError).toBe("no_channel");
    }

    const rows = await prisma.notificationTask.findMany({
      where: { caseId: kase.id, kind: "peer_urgent" },
    });
    expect(rows.every((r) => r.status === "failed" && r.lastError === "no_channel")).toBe(true);

    const visible = await sentTasks(kase.id, lawyerCookie);
    expect(visible.map((t) => t.status)).toEqual(["failed", "failed"]);

    await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("lists incoming alerts only in the addressed recipient's inbox", async () => {
    const { kase, coordinatorCookie, lawyer, lawyerCookie, client, clientCookie } =
      await seedUrgentCase();
    const [task] = await postUrgent(kase.id, lawyerCookie, [client.id]);

    const inboxRes = await listNotifications(
      getRequest("/api/notifications", cookieHeader(clientCookie)),
    );
    expect(inboxRes.status).toBe(200);
    const inbox = (await inboxRes.json()).notifications as Array<Record<string, unknown>>;
    expect(inbox).toHaveLength(1);
    expect(inbox[0]!.id).toBe(task!.id);
    expect(inbox[0]!.caseId).toBe(kase.id);
    expect(inbox[0]!.senderDisplayName).toBe(lawyer.displayName);
    expect(JSON.stringify(inbox)).not.toContain("@");

    for (const cookie of [lawyerCookie, coordinatorCookie]) {
      const res = await listNotifications(getRequest("/api/notifications", cookieHeader(cookie)));
      expect(((await res.json()).notifications as unknown[]).length).toBe(0);
    }
  });

  it("cancels queued alerts when the recipient is revoked or the case is archived", async () => {
    const { kase, coordinator, coordinatorCookie, lawyerCookie, client } =
      await seedUrgentCase();
    const [forClient] = await postUrgent(kase.id, lawyerCookie, [client.id]);

    const revokeRes = await revokeMember(
      sendJson("DELETE", `/api/cases/${kase.id}/members/${client.id}`, {}, cookieHeader(coordinatorCookie)),
      memberParams(kase.id, client.id),
    );
    expect(revokeRes.status).toBe(200);
    const revokedTask = await prisma.notificationTask.findUniqueOrThrow({
      where: { id: forClient!.id as string },
    });
    expect(revokedTask.status).toBe("cancelled");
    expect(revokedTask.cancelledAt).not.toBeNull();

    const [forCoordinator] = await postUrgent(kase.id, lawyerCookie, [coordinator.id]);
    const archiveRes = await archiveCase(
      sendJson("POST", `/api/cases/${kase.id}/archive`, {}, cookieHeader(coordinatorCookie)),
      params(kase.id),
    );
    expect(archiveRes.status).toBe(200);
    const archivedTask = await prisma.notificationTask.findUniqueOrThrow({
      where: { id: forCoordinator!.id as string },
    });
    expect(archivedTask.status).toBe("cancelled");

    const visible = await sentTasks(kase.id, lawyerCookie);
    expect(visible.every((t) => t.status === "cancelled")).toBe(true);

    await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });

  it("worker pre-send recheck cancels alerts whose recipient lost membership", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    const [task] = await postUrgent(kase.id, lawyerCookie, [client.id]);
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: client.id } },
      data: { status: "revoked", revokedAt: new Date() },
    });

    const summary = await runNotificationWorkerOnce({});
    expect(fakeEmailProvider.outbox).toHaveLength(0);
    const row = await prisma.notificationTask.findUniqueOrThrow({
      where: { id: task!.id as string },
    });
    expect(row.status).toBe("cancelled");
    expect(row.lastError).toBe("permission_revoked");
    expect(summary.cancelled).toBeGreaterThan(0);
  });
});
