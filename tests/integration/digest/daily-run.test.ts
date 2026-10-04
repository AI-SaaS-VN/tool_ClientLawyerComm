import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { generateDigestsForDate } from "@/modules/digest/service";
import { digestDedupeKey } from "@/modules/digest/subject";
import { runNotificationWorkerOnce } from "@/server/jobs/worker";
import { fakeEmailProvider } from "@/server/providers/email/fake";
import { getStorageProvider } from "@/server/providers/storage";

import {
  addMember,
  createVerifiedUser,
  resetDatabase,
  seedCaseWithCoordinator,
} from "../helpers";

// 2026-10-09 09:00 in Asia/Ho_Chi_Minh: the digest covers 2026-10-08 HCMC,
// i.e. the UTC window [2026-10-07T17:00Z, 2026-10-08T17:00Z).
const NOW = new Date("2026-10-09T02:00:00Z");
const IN_WINDOW = new Date("2026-10-08T03:00:00Z"); // 10:00 HCMC that day
const TWO_DAYS_BEFORE = new Date("2026-10-06T03:00:00Z");
const fixedClock = { now: () => NOW };

type RecipientsJson = {
  emailed: string[];
  skipped: { userId: string; reason: string }[];
};

async function seedPublishedMessage(
  caseId: string,
  authorId: string,
  key: string,
  sourceText: string,
  publishedAt: Date,
) {
  const message = await prisma.message.create({
    data: {
      caseId,
      authorId,
      idempotencyKey: key,
      sourceLang: "zh-Hans",
      sourceText,
      status: "published",
      publishedAt,
    },
  });
  return message;
}

async function seedPublishedFile(
  caseId: string,
  uploaderId: string,
  name: string,
  bytes: Buffer,
  publishedAt: Date,
) {
  const file = await prisma.file.create({
    data: {
      caseId,
      uploaderId,
      status: "published",
      origHash: `hash-${name}`,
      storageKey: `quarantine/${caseId}/${name}/original`,
      mime: "application/pdf",
      sizeBytes: bytes.length,
      originalName: name,
      publishedAt,
    },
  });
  const sharedKey = `shared/${caseId}/${file.id}/v1`;
  await getStorageProvider().putObject(sharedKey, bytes);
  await prisma.fileVariant.create({
    data: { fileId: file.id, kind: "shared_copy", version: 1, storageKey: sharedKey },
  });
  return file;
}

// Case "DG-Juyang" with one verified coordinator, one coordinator without a
// channel, a verified lawyer, and a verified client; one published message
// with a done translation plus one published file in the covered day.
async function seedDigestCase() {
  const { kase, coordinator } = await seedCaseWithCoordinator("DG-Juyang");
  const channelLess = await prisma.user.create({
    data: { displayName: "coord-nochannel", globalRole: "coordinator" },
  });
  await addMember(kase.id, channelLess.id, "coordinator");
  const { user: lawyer } = await createVerifiedUser("lawyer", "lawyer-digest@example.com");
  await addMember(kase.id, lawyer.id, "lawyer");
  const { user: client } = await createVerifiedUser("client", "client-digest@example.com");
  await addMember(kase.id, client.id, "client");

  const message = await seedPublishedMessage(
    kase.id,
    client.id,
    "dig-1",
    "明天上午十点开庭",
    IN_WINDOW,
  );
  await prisma.translationVersion.create({
    data: {
      messageId: message.id,
      targetLang: "vi",
      version: 1,
      text: "Mười giờ sáng mai ra tòa",
      status: "done",
    },
  });
  // Excluded: unpublished content of the covered day and older published work.
  await prisma.message.create({
    data: {
      caseId: kase.id,
      authorId: lawyer.id,
      idempotencyKey: "dig-held",
      sourceLang: "zh-Hans",
      sourceText: "待审内容不应出现",
      status: "pending_review",
    },
  });
  await seedPublishedMessage(kase.id, client.id, "dig-old", "两天前的旧消息", TWO_DAYS_BEFORE);

  const fileBytes = Buffer.from("fictitious pdf bytes");
  await seedPublishedFile(kase.id, lawyer.id, "evidence.pdf", fileBytes, IN_WINDOW);
  return { kase, coordinator, channelLess, lawyer, client, fileBytes };
}

describe("daily case digest (REQ-DIG-01..06)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("queues one case_digest task per verified coordinator per part — lawyers and clients get nothing", async () => {
    const { kase, coordinator, channelLess, lawyer, client } = await seedDigestCase();

    const summary = await generateDigestsForDate(NOW);
    expect(summary.digestDate).toBe("2026-10-08");
    expect(summary.generated).toBe(1);

    const tasks = await prisma.notificationTask.findMany({ where: { kind: "case_digest" } });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.recipientUserId).toBe(coordinator.id);
    expect(tasks[0]!.dedupeKey).toBe(
      digestDedupeKey(kase.id, "2026-10-08", coordinator.id, 1),
    );
    expect(tasks[0]!.status).toBe("queued");
    expect(tasks[0]!.recipientChannelId).not.toBeNull();
    for (const excluded of [lawyer.id, client.id, channelLess.id]) {
      expect(tasks.some((t) => t.recipientUserId === excluded)).toBe(false);
    }

    // The run records the emailed coordinator and the skipped one (REQ-DIG-02).
    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("queued");
    expect(run.parts).toBe(1);
    const recipients = run.recipientsJson as unknown as RecipientsJson;
    expect(recipients.emailed).toEqual([coordinator.id]);
    expect(recipients.skipped).toEqual([
      { userId: channelLess.id, reason: "no_verified_email" },
    ]);

    // The rendered body is frozen on the run: source text plus the published
    // translation, sorted by time; pending_review and older content excluded.
    const body = run.bodyText!;
    expect(body).toContain("明天上午十点开庭");
    expect(body).toContain("Mười giờ sáng mai ra tòa");
    expect(body).not.toContain("待审内容不应出现");
    expect(body).not.toContain("两天前的旧消息");
  });

  it("the worker sends the digest with subject, body, and the published attachment, then audits it", async () => {
    const { kase, coordinator, fileBytes } = await seedDigestCase();
    await generateDigestsForDate(NOW);

    const result = await runNotificationWorkerOnce({ clock: fixedClock });
    expect(result.submitted).toBe(1);

    expect(fakeEmailProvider.outbox).toHaveLength(1);
    const email = fakeEmailProvider.outbox[0]!;
    expect(email.to).toBe("coordinator1@example.com");
    expect(email.subject).toBe("DG-Juyang-2026OCT8-Record");
    expect(email.text).toContain("明天上午十点开庭");
    expect(email.text).toContain("Mười giờ sáng mai ra tòa");
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments![0]!.filename).toBe("evidence.pdf");
    expect(email.attachments![0]!.content.equals(fileBytes)).toBe(true);

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("sent");

    // REQ-DIG-06: one audit row per send — target is the digest run, never content.
    const audits = await prisma.auditLog.findMany({ where: { action: "digest.send" } });
    expect(audits).toHaveLength(1);
    expect(audits[0]!.actorId).toBe(coordinator.id);
    expect(audits[0]!.targetId).toBe(run.id);
    expect(audits[0]!.caseId).toBe(kase.id);
    expect(audits[0]!.result).toBe("success");
  });

  it("records an empty day as skipped with zero tasks", async () => {
    const { kase } = await seedCaseWithCoordinator("Empty Day Case");

    const summary = await generateDigestsForDate(NOW);
    expect(summary.skipped).toBe(1);
    expect(await prisma.notificationTask.count({ where: { kind: "case_digest" } })).toBe(0);

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("skipped");
    expect(run.error).toBe("empty_day");
    expect(run.parts).toBe(0);
  });

  it("skips a case whose coordinators all lack a verified email", async () => {
    const { kase, coordinator, channelLess } = await seedDigestCase();
    await prisma.contactChannel.deleteMany({ where: { userId: coordinator.id } });

    const summary = await generateDigestsForDate(NOW);
    expect(summary.skipped).toBe(1);
    expect(await prisma.notificationTask.count({ where: { kind: "case_digest" } })).toBe(0);

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("skipped");
    expect(run.error).toBe("no_verified_coordinator");
    const recipients = run.recipientsJson as unknown as RecipientsJson;
    expect(recipients.emailed).toEqual([]);
    expect(recipients.skipped.map((s) => s.userId).sort()).toEqual(
      [coordinator.id, channelLess.id].sort(),
    );
  });

  it("skips archived cases without sending", async () => {
    const { kase } = await seedDigestCase();
    await prisma.case.update({ where: { id: kase.id }, data: { status: "archived" } });

    await generateDigestsForDate(NOW);
    expect(await prisma.notificationTask.count({ where: { kind: "case_digest" } })).toBe(0);

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("skipped");
    expect(run.error).toBe("case_archived");
  });

  it("is idempotent: a second generation for the same date creates nothing", async () => {
    const { kase } = await seedDigestCase();

    await generateDigestsForDate(NOW);
    const again = await generateDigestsForDate(NOW);
    expect(again.generated).toBe(0);
    expect(again.skipped).toBe(0);

    expect(await prisma.digestRun.count({ where: { caseId: kase.id } })).toBe(1);
    expect(
      await prisma.notificationTask.count({ where: { kind: "case_digest" } }),
    ).toBe(1);
    // Sending is idempotent too: a second worker pass sends nothing more.
    await runNotificationWorkerOnce({ clock: fixedClock });
    await runNotificationWorkerOnce({ clock: fixedClock });
    expect(fakeEmailProvider.outbox).toHaveLength(1);
  });

  it("splits oversized attachment sets into part emails with (n/m) subjects", async () => {
    const { kase, coordinator, lawyer } = await seedDigestCase();
    await seedPublishedFile(kase.id, lawyer.id, "photos.jpg", Buffer.from("12345678"), IN_WINDOW);

    // Test-only cap: evidence.pdf (20 bytes) + photos.jpg (8 bytes) no longer
    // fit together, so the digest splits into two parts.
    await generateDigestsForDate(NOW, { maxPartBytes: 24 });

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.parts).toBe(2);
    expect(run.partsJson).toHaveLength(2);

    const tasks = await prisma.notificationTask.findMany({
      where: { kind: "case_digest", recipientUserId: coordinator.id },
      orderBy: { dedupeKey: "asc" },
    });
    expect(tasks).toHaveLength(2);

    await runNotificationWorkerOnce({ clock: fixedClock });
    const subjects = fakeEmailProvider.outbox.map((m) => m.subject).sort();
    expect(subjects).toEqual([
      "DG-Juyang-2026OCT8-Record (1/2)",
      "DG-Juyang-2026OCT8-Record (2/2)",
    ]);
    fakeEmailProvider.outbox.forEach((email, index) => {
      expect(email.text).toContain(`Phần ${index + 1}/2`);
    });
    const allNames = fakeEmailProvider.outbox.flatMap(
      (m) => m.attachments?.map((a) => a.filename) ?? [],
    );
    expect(allNames.sort()).toEqual(["evidence.pdf", "photos.jpg"]);
    const sentRun = await prisma.digestRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(sentRun.status).toBe("sent");
  });

  it("a final send failure stays visible on the task and the digest run", async () => {
    const { kase } = await seedDigestCase();
    await generateDigestsForDate(NOW);
    const failing = { send: async () => ({ accepted: false }) };
    let t = NOW.getTime();
    const clock = { now: () => new Date(t) };

    // 5 attempts at the REQ-NTF-05 backoff, then terminal failure.
    for (const advanceMs of [0, 60_000, 5 * 60_000, 15 * 60_000, 15 * 60_000]) {
      t += advanceMs;
      await runNotificationWorkerOnce({ clock, emailProvider: failing });
    }

    const task = await prisma.notificationTask.findFirstOrThrow({
      where: { kind: "case_digest" },
    });
    expect(task.status).toBe("failed");
    expect(task.attempts).toBe(5);

    const run = await prisma.digestRun.findUniqueOrThrow({
      where: { caseId_digestDate: { caseId: kase.id, digestDate: "2026-10-08" } },
    });
    expect(run.status).toBe("failed");
    expect(run.error).not.toBeNull();
    expect(fakeEmailProvider.outbox).toHaveLength(0);
  });
});
