import { beforeEach, describe, expect, it } from "vitest";

import { POST as sendUrgent } from "@/app/api/cases/[id]/urgent/route";
import { prisma } from "@/lib/db";

import {
  addMember,
  createVerifiedUser,
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

async function postUrgent(caseId: string, cookie: string | null, body: unknown) {
  return sendUrgent(
    postJson(`/api/cases/${caseId}/urgent`, body, cookie ? { cookie } : {}),
    params(caseId),
  );
}

describe("peer urgent dedupe & cooldown (REQ-NTF-02/05)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates one queued peer_urgent task per recipient with a verified channel", async () => {
    const { kase, coordinator, lawyer, lawyerCookie, client } = await seedUrgentCase();

    const res = await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id, coordinator.id],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tasks).toHaveLength(2);
    for (const task of body.tasks) {
      expect(task.status).toBe("queued");
      expect(task.deduped).toBe(false);
    }

    const rows = await prisma.notificationTask.findMany({ where: { caseId: kase.id } });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.kind === "peer_urgent")).toBe(true);
    expect(rows.every((r) => r.senderUserId === lawyer.id)).toBe(true);
    expect(rows.every((r) => r.recipientChannelId !== null)).toBe(true);
    expect(new Set(rows.map((r) => r.recipientUserId))).toEqual(
      new Set([client.id, coordinator.id]),
    );
  });

  it("returns the existing task on repeated clicks inside the 10-minute window", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();

    const first = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();
    const second = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();

    expect(second.tasks).toHaveLength(1);
    expect(second.tasks[0].id).toBe(first.tasks[0].id);
    expect(second.tasks[0].deduped).toBe(true);
    expect(await prisma.notificationTask.count({ where: { caseId: kase.id } })).toBe(1);
  });

  it("creates a fresh task once the cooldown window has expired", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();

    const first = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();
    await prisma.notificationTask.update({
      where: { id: first.tasks[0].id },
      data: { createdAt: new Date(Date.now() - 11 * 60_000) },
    });

    const second = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();
    expect(second.tasks[0].deduped).toBe(false);
    expect(second.tasks[0].id).not.toBe(first.tasks[0].id);
    expect(await prisma.notificationTask.count({ where: { caseId: kase.id } })).toBe(2);
  });

  it("does not reuse a terminal task inside the window", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();

    const first = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();
    await prisma.notificationTask.update({
      where: { id: first.tasks[0].id },
      data: { status: "failed", lastError: "provider_rejected" },
    });

    const second = await (await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    })).json();
    expect(second.tasks[0].deduped).toBe(false);
    expect(second.tasks[0].status).toBe("queued");
    expect(await prisma.notificationTask.count({ where: { caseId: kase.id } })).toBe(2);
  });

  it("rejects recipients who are not active members of the case", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider@example.com");

    const cases: Array<[string, unknown]> = [
      ["outsider user id", { recipientUserIds: [outsider.id] }],
      ["arbitrary text", { recipientUserIds: ["not-a-user-id"] }],
      ["arbitrary email", { recipientUserIds: ["someone@example.com"] }],
      ["empty list", { recipientUserIds: [] }],
      ["missing field", {}],
    ];
    for (const [label, body] of cases) {
      const res = await postUrgent(kase.id, lawyerCookie, body);
      expect(res.status, label).toBe(400);
      expect((await res.json()).error, label).toBe("invalid_recipient");
    }

    // A revoked member is no longer a valid recipient.
    await prisma.caseMember.update({
      where: { caseId_userId: { caseId: kase.id, userId: client.id } },
      data: { status: "revoked", revokedAt: new Date() },
    });
    const res = await postUrgent(kase.id, lawyerCookie, { recipientUserIds: [client.id] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_recipient");

    expect(await prisma.notificationTask.count({ where: { caseId: kase.id } })).toBe(0);
  });

  it("accepts a single recipient id as well as a list", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    const res = await postUrgent(kase.id, lawyerCookie, { recipientUserId: client.id });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].recipientUserId).toBe(client.id);
  });

  it("rejects non-member senders, anonymous callers, and archived cases", async () => {
    const { kase, lawyerCookie, client } = await seedUrgentCase();
    const { user: outsider } = await createVerifiedUser("lawyer", "outsider2@example.com");
    const outsiderCookie = await sessionCookieFor(outsider.id);

    const asOutsider = await postUrgent(kase.id, outsiderCookie, {
      recipientUserIds: [client.id],
    });
    expect(asOutsider.status).toBe(403);

    const anonymous = await postUrgent(kase.id, null, { recipientUserIds: [client.id] });
    expect(anonymous.status).toBe(401);

    await prisma.case.update({ where: { id: kase.id }, data: { status: "archived" } });
    const archived = await postUrgent(kase.id, lawyerCookie, {
      recipientUserIds: [client.id],
    });
    expect(archived.status).toBe(409);
    expect((await archived.json()).error).toBe("case_archived");
  });
});
