import { Prisma, type DigestRun } from "@prisma/client";

import { prisma } from "@/lib/db";
import { pickEmailChannel } from "@/server/jobs/queue";
import type { EmailAttachment } from "@/server/providers/email/interface";
import { getStorageProvider } from "@/server/providers/storage";

import {
  buildDigestSubject,
  digestDedupeKey,
  formatVietnamClock,
  justEndedVietnamDay,
  packFilesIntoParts,
  type VietnamDay,
} from "./subject";

export interface DigestGenerationSummary {
  digestDate: string;
  generated: number;
  skipped: number;
}

export interface DigestRecipients {
  emailed: string[];
  skipped: { userId: string; reason: string }[];
}

const NO_RECIPIENTS: DigestRecipients = { emailed: [], skipped: [] };

// REQ-DIG-01: generate the digest for the single just-ended Vietnam calendar
// day. Idempotent via the unique (case_id, digest_date) on digest_runs plus
// pre-filtered task dedupe keys, so worker restarts and 10s ticks are safe.
export async function generateDigestsForDate(
  now: Date,
  options: { maxPartBytes?: number } = {},
): Promise<DigestGenerationSummary> {
  const day = justEndedVietnamDay(now);
  const cases = await prisma.case.findMany({
    where: { digestRuns: { none: { digestDate: day.digestDate } } },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  const summary: DigestGenerationSummary = {
    digestDate: day.digestDate,
    generated: 0,
    skipped: 0,
  };
  for (const kase of cases) {
    const outcome = await generateForCase(kase, day, options.maxPartBytes);
    if (outcome === "generated") summary.generated += 1;
    if (outcome === "skipped") summary.skipped += 1;
  }
  return summary;
}

// One transaction per case: the digest_runs row and its case_digest tasks
// commit or roll back together. A lost unique-constraint race means another
// pass already generated this day — treat it as done.
async function generateForCase(
  kase: { id: string; title: string; status: string },
  day: VietnamDay,
  maxPartBytes?: number,
): Promise<"generated" | "skipped" | "exists"> {
  try {
    return await prisma.$transaction(async (tx) => {
      const skip = async (reason: string, recipients: DigestRecipients = NO_RECIPIENTS) => {
        await tx.digestRun.create({
          data: {
            caseId: kase.id,
            digestDate: day.digestDate,
            status: "skipped",
            parts: 0,
            error: reason,
            recipientsJson: recipients as unknown as Prisma.InputJsonValue,
          },
        });
        return "skipped" as const;
      };

      // Archived cases are never sent (REQ-DIG-01) but still recorded, so
      // generation for the day stays idempotent.
      if (kase.status !== "active") return skip("case_archived");

      const [messages, files] = await Promise.all([
        tx.message.findMany({
          where: {
            caseId: kase.id,
            status: "published",
            publishedAt: { gte: day.startUtc, lt: day.endUtc },
          },
          include: {
            author: { select: { displayName: true } },
            translations: { where: { status: "done" } },
          },
          orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
        }),
        tx.file.findMany({
          where: {
            caseId: kase.id,
            status: "published",
            publishedAt: { gte: day.startUtc, lt: day.endUtc },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
      ]);

      // REQ-DIG-03: nothing newly published that day → send nothing.
      if (messages.length === 0 && files.length === 0) return skip("empty_day");

      // REQ-DIG-02: every active coordinator member is a recipient at their
      // own verified email; the duty flags (can_review/is_backup) do not
      // gate the digest, and digest_opt_out stays unused (REQ-DIG-03).
      const coordinators = await tx.caseMember.findMany({
        where: { caseId: kase.id, status: "active", memberRole: "coordinator" },
        select: { userId: true },
        orderBy: { createdAt: "asc" },
      });
      const recipients: DigestRecipients = { emailed: [], skipped: [] };
      const channelByUser = new Map<string, string>();
      for (const { userId } of coordinators) {
        const channel = await pickEmailChannel(tx, userId);
        if (channel) {
          recipients.emailed.push(userId);
          channelByUser.set(userId, channel.id);
        } else {
          recipients.skipped.push({ userId, reason: "no_verified_email" });
        }
      }
      if (recipients.emailed.length === 0) return skip("no_verified_coordinator", recipients);

      const parts = packFilesIntoParts(
        files.map((file) => ({ id: file.id, sizeBytes: file.sizeBytes })),
        maxPartBytes,
      );
      const bodyText = renderDigestBody(kase.title, day.digestDate, messages, files.length);

      await tx.digestRun.create({
        data: {
          caseId: kase.id,
          digestDate: day.digestDate,
          status: "queued",
          parts: parts.length,
          recipientsJson: recipients as unknown as Prisma.InputJsonValue,
          bodyText,
          partsJson: parts as unknown as Prisma.InputJsonValue,
        },
      });

      // One queued task per (coordinator, part), pre-filtering existing
      // dedupe keys like createAlertRows in the queue module.
      const keys = recipients.emailed.flatMap((userId) =>
        parts.map((part) => digestDedupeKey(kase.id, day.digestDate, userId, part.part)),
      );
      const existing = await tx.notificationTask.findMany({
        where: { dedupeKey: { in: keys } },
        select: { dedupeKey: true },
      });
      const taken = new Set(existing.map((row) => row.dedupeKey));
      const rows: Prisma.NotificationTaskCreateManyInput[] = [];
      for (const userId of recipients.emailed) {
        for (const part of parts) {
          const dedupeKey = digestDedupeKey(kase.id, day.digestDate, userId, part.part);
          if (taken.has(dedupeKey)) continue;
          rows.push({
            kind: "case_digest",
            caseId: kase.id,
            recipientUserId: userId,
            recipientChannelId: channelByUser.get(userId)!,
            dedupeKey,
          });
        }
      }
      if (rows.length > 0) await tx.notificationTask.createMany({ data: rows });
      return "generated" as const;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "exists";
    }
    throw error;
  }
}

// The body is rendered once at generation and frozen on the run (body_text),
// so a later republication cannot change an already-queued digest. Bilingual
// zh-Hans/vi headings match the platform's other coordinator emails.
type DigestMessage = {
  sourceLang: string;
  sourceText: string;
  publishedAt: Date | null;
  author: { displayName: string };
  translations: { targetLang: string; text: string | null; version: number }[];
};

function renderDigestBody(
  caseTitle: string,
  digestDate: string,
  messages: DigestMessage[],
  fileCount: number,
): string {
  const lines = [
    "案件日报 / Nhật ký vụ án hằng ngày",
    `案件 / Vụ án: ${caseTitle}`,
    `日期 / Ngày: ${digestDate} (Asia/Ho_Chi_Minh)`,
    "",
    `消息 / Tin nhắn (${messages.length}):`,
  ];
  for (const message of messages) {
    lines.push(
      "",
      `[${formatVietnamClock(message.publishedAt!)}] ${message.author.displayName}`,
      `原文 / Nguyên văn (${message.sourceLang}): ${message.sourceText}`,
    );
    // Latest done version per target language only (REQ-DIG-01: published
    // translated text).
    const latestByLang = new Map<string, { text: string | null; version: number }>();
    for (const translation of message.translations) {
      const current = latestByLang.get(translation.targetLang);
      if (!current || translation.version > current.version) {
        latestByLang.set(translation.targetLang, translation);
      }
    }
    for (const [targetLang, translation] of [...latestByLang.entries()].sort()) {
      if (translation.text) {
        lines.push(`译文 / Bản dịch (${targetLang}): ${translation.text}`);
      }
    }
  }
  lines.push("", `附件 / Tệp đính kèm (${fileCount}): 随邮件附件发送 / gửi kèm theo email`);
  return lines.join("\n");
}

// Worker-side email construction: the frozen body plus the part's published
// shared-copy bytes from storage (REQ-DIG-05). Multi-part emails get a part
// header and the " (n/m)" subject suffix.
export async function buildDigestPartEmail(input: {
  caseTitle: string;
  run: DigestRun;
  part: number;
}): Promise<{ subject: string; text: string; attachments: EmailAttachment[] }> {
  const { run, part } = input;
  const plans = (run.partsJson ?? []) as unknown as { part: number; fileIds: string[] }[];
  const plan = plans.find((p) => p.part === part);
  if (!plan) throw new Error(`digest run ${run.id} has no part ${part}`);

  const subject = buildDigestSubject(input.caseTitle, run.digestDate, {
    index: part,
    total: run.parts,
  });
  const text =
    run.parts > 1
      ? `本部分 / Phần ${part}/${run.parts}\n\n${run.bodyText ?? ""}`
      : (run.bodyText ?? "");

  const files = await prisma.file.findMany({ where: { id: { in: plan.fileIds } } });
  const byId = new Map(files.map((file) => [file.id, file]));
  const attachments: EmailAttachment[] = [];
  for (const fileId of plan.fileIds) {
    const file = byId.get(fileId);
    if (!file) continue;
    const variant = await prisma.fileVariant.findFirst({
      where: { fileId, kind: "shared_copy" },
      orderBy: { version: "desc" },
    });
    if (!variant) continue;
    attachments.push({
      filename: file.originalName,
      content: await getStorageProvider().getObject(variant.storageKey),
    });
  }
  return { subject, text, attachments };
}

// After a part task reaches a terminal state, fold the whole run's tasks into
// the run status: still queued → keep waiting (only the error is recorded);
// otherwise sent / partial / failed (REQ-DIG-05: final failure stays visible).
export async function refreshDigestRunStatus(
  run: { id: string; caseId: string; digestDate: string },
  error: string | null,
): Promise<void> {
  const tasks = await prisma.notificationTask.findMany({
    where: { dedupeKey: { startsWith: `digest:${run.caseId}:${run.digestDate}:` } },
    select: { status: true },
  });
  if (tasks.some((task) => task.status === "queued")) {
    if (error) {
      await prisma.digestRun.update({ where: { id: run.id }, data: { error } });
    }
    return;
  }
  const delivered = tasks.some((task) => task.status === "submitted");
  const unsuccessful = tasks.some(
    (task) => task.status === "failed" || task.status === "cancelled",
  );
  await prisma.digestRun.update({
    where: { id: run.id },
    data: {
      status: unsuccessful ? (delivered ? "partial" : "failed") : "sent",
      ...(error ? { error } : {}),
    },
  });
}
