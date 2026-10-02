import { beforeEach, describe, expect, it } from "vitest";

import { GET as listUrgent, POST as sendUrgent } from "@/app/api/cases/[id]/urgent/route";
import { POST as confirmNotification } from "@/app/api/notifications/[id]/confirm/route";
import { prisma } from "@/lib/db";
import { runNotificationWorkerOnce } from "@/server/jobs/worker";

import {
  addMember,
  cookieHeader,
  createVerifiedUser,
  getRequest,
  postJson,
  resetDatabase,
  seedCaseWithCoordinator,
  sessionCookieFor,
} from "../helpers";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
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

async function postUrgentTask(
  caseId: string,
  cookie: string,
  recipientUserId: string,
): Promise<string> {
  const res = await sendUrgent(
    postJson(`/api/cases/${caseId}/urgent`, { recipientUserIds: [recipientUserId] }, { cookie }),
    params(caseId),
  );
  expect(res.status).toBe(201);
  const body = await res.json();
  return body.tasks[0].id as string;
}

async function confirm(taskId: string, cookie: string | null) {
  return confirmNotification(
    postJson(`/api/notifications/${taskId}/confirm`, {}, cookie ? { cookie } : {}),
    params(taskId),
  );
}

describe("peer urgent in-app confirmation (REQ-NTF-06)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lets the recipient confirm receipt; the sender sees the confirmation", async () => {
    const { kase, lawyerCookie, client, clientCookie } = await seedUrgentCase();
    const taskId = await postUrgentTask(kase.id, lawyerCookie, client.id);
    await runNotificationWorkerOnce({});

    const res = await confirm(taskId, clientCookie);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.task.status).toBe("in_app_confirmed");
    expect(body.task.confirmedAt).not.toBeNull();

    const row = await prisma.notificationTask.findUniqueOrThrow({ where: { id: taskId } });
    expect(row.status).toBe("in_app_confirmed");
    expect(row.confirmedAt).not.toBeNull();

    const senderView = await listUrgent(
      getRequest(`/api/cases/${kase.id}/urgent`, cookieHeader(lawyerCookie)),
      params(kase.id),
    );
    const tasks = (await senderView.json()).tasks as Array<Record<string, unknown>>;
    expect(tasks[0]!.status).toBe("in_app_confirmed");
    expect(tasks[0]!.confirmedAt).not.toBeNull();
  });

  it("forbids anyone but the addressed recipient from confirming", async () => {
    const { kase, coordinatorCookie, lawyerCookie, client, clientCookie } =
      await seedUrgentCase();
    void clientCookie;
    const taskId = await postUrgentTask(kase.id, lawyerCookie, client.id);

    const asCoordinator = await confirm(taskId, coordinatorCookie);
    expect(asCoordinator.status).toBe(403);
    const asSender = await confirm(taskId, lawyerCookie);
    expect(asSender.status).toBe(403);
    const anonymous = await confirm(taskId, null);
    expect(anonymous.status).toBe(401);
    const missing = await confirm("00000000-0000-0000-0000-000000000000", lawyerCookie);
    expect(missing.status).toBe(404);

    const row = await prisma.notificationTask.findUniqueOrThrow({ where: { id: taskId } });
    expect(row.status).toBe("queued");
    expect(row.confirmedAt).toBeNull();
  });

  it("rejects confirming a task already in a terminal failed or cancelled state", async () => {
    const { kase, lawyerCookie, client, clientCookie } = await seedUrgentCase();
    const taskId = await postUrgentTask(kase.id, lawyerCookie, client.id);
    await prisma.notificationTask.update({
      where: { id: taskId },
      data: { status: "failed", lastError: "provider_rejected" },
    });
    const failed = await confirm(taskId, clientCookie);
    expect(failed.status).toBe(409);

    const secondId = await postUrgentTask(kase.id, lawyerCookie, client.id);
    await prisma.notificationTask.update({
      where: { id: secondId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    const cancelled = await confirm(secondId, clientCookie);
    expect(cancelled.status).toBe(409);
  });

  it("is idempotent and keeps the first confirmation time", async () => {
    const { kase, lawyerCookie, client, clientCookie } = await seedUrgentCase();
    const taskId = await postUrgentTask(kase.id, lawyerCookie, client.id);

    const first = await confirm(taskId, clientCookie);
    expect(first.status).toBe(200);
    const firstAt = (await first.json()).task.confirmedAt as string;

    const second = await confirm(taskId, clientCookie);
    expect(second.status).toBe(200);
    expect((await second.json()).task.confirmedAt).toBe(firstAt);

    const row = await prisma.notificationTask.findUniqueOrThrow({ where: { id: taskId } });
    expect(new Date(firstAt).getTime()).toBe(row.confirmedAt!.getTime());
  });

  it("only peer_urgent tasks are confirmable", async () => {
    const { kase, client, clientCookie } = await seedUrgentCase();
    const reviewAlert = await prisma.notificationTask.create({
      data: {
        kind: "review_alert",
        caseId: kase.id,
        recipientUserId: client.id,
        dedupeKey: `review_alert:manual:${client.id}:l0`,
      },
    });

    const res = await confirm(reviewAlert.id, clientCookie);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_kind");
  });
});
