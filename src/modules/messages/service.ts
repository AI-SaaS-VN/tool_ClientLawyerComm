import { Prisma, type Message, type User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getMessageChecker, normalizeCheckResult } from "@/modules/messages/check";
import { detectSourceLang } from "@/modules/messages/lang";
import {
  attachTranslations,
  type TranslationView,
} from "@/modules/translation/service";
import { fileVisibleTo, toFileView } from "@/modules/files/service";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { recordAudit } from "@/server/audit/log";
import { listAlertIssueReviewTaskIds, registerCheckFailedAlerts, registerHoldAlerts } from "@/server/jobs/queue";
import { publishToCase } from "@/server/sse/hub";

export const MESSAGE_MAX_CHARS = 4000;
const SOURCE_LANGS = new Set(["zh-Hans", "zh-Hant", "vi", "en"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MessageWithAuthor = Message & { author: User };

// Never include registered contact channels (REQ-PM-09). The author is the
// display name plus the case role (client, lawyer, or coordinator).
export function toMessageView(message: MessageWithAuthor, authorRole: string) {
  return {
    id: message.id,
    caseId: message.caseId,
    authorId: message.authorId,
    authorDisplayName: message.author.displayName,
    authorRole,
    sourceLang: message.sourceLang,
    sourceText: message.sourceText,
    status: message.status,
    publishedAt: message.publishedAt,
    createdAt: message.createdAt,
  };
}

async function roleOnCase(caseId: string, userId: string, fallback: string): Promise<string> {
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId } },
    select: { memberRole: true },
  });
  return member?.memberRole ?? fallback;
}

export async function messageViewWithRole(message: MessageWithAuthor) {
  return toMessageView(
    message,
    await roleOnCase(message.caseId, message.authorId, message.author.globalRole),
  );
}

async function viewsFor(rows: MessageWithAuthor[]) {
  const caseId = rows[0]?.caseId;
  const members = caseId
    ? await prisma.caseMember.findMany({
        where: { caseId, userId: { in: rows.map((row) => row.authorId) } },
        select: { userId: true, memberRole: true },
      })
    : [];
  const roles = new Map(members.map((member) => [member.userId, member.memberRole]));
  return rows.map((row) => toMessageView(row, roles.get(row.authorId) ?? row.author.globalRole));
}

function readIdempotencyKey(headers: Headers): string {
  const key = headers.get("idempotency-key")?.trim();
  if (!key || key.length > 128 || /[\r\n]/.test(key)) {
    throw new ApiError(400, "idempotency_key_required");
  }
  return key;
}

function readSourceText(body: Record<string, unknown>): string {
  const text = body.sourceText;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new ApiError(400, "invalid_text");
  }
  if ([...text].length > MESSAGE_MAX_CHARS) {
    throw new ApiError(400, "message_too_long");
  }
  return text;
}

function readCitedFileId(body: Record<string, unknown>): string | null {
  const raw = body.citedFileId;
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string" || !UUID_RE.test(raw)) throw new ApiError(400, "invalid_cited_file");
  return raw;
}

async function assertCiteable(
  caseId: string,
  fileId: string,
  user: User,
  isReviewer: boolean,
): Promise<void> {
  const file = await prisma.file.findFirst({ where: { id: fileId, caseId } });
  if (!file || !fileVisibleTo(file, user.id, isReviewer)) throw new ApiError(404, "not_found");
}

function readSourceLang(body: Record<string, unknown>, text: string): string {
  const explicit = body.sourceLang;
  if (explicit === undefined || explicit === null) return detectSourceLang(text);
  if (typeof explicit !== "string" || !SOURCE_LANGS.has(explicit)) {
    throw new ApiError(400, "invalid_source_lang");
  }
  return explicit;
}

// REQ-MSG-01: fixed order — guards (membership re-checked per request, archived
// case 409) → store in the restricted pending area → check stage → publish.
// Any failure keeps the message pending; it is never published by default.
export async function sendMessage(
  caseId: string,
  author: User,
  body: Record<string, unknown>,
  headers: Headers,
): Promise<{ view: MessageView; replayed: boolean }> {
  const member = await requireCaseMember(caseId, author);
  await requireWritableCase(caseId);
  const idempotencyKey = readIdempotencyKey(headers);
  const sourceText = readSourceText(body);
  const sourceLang = readSourceLang(body, sourceText);
  const citedFileId = readCitedFileId(body);
  if (citedFileId) {
    await assertCiteable(
      caseId,
      citedFileId,
      author,
      member.memberRole === "coordinator" && member.canReview,
    );
  }

  const uniqueKey = { caseId_authorId_idempotencyKey: { caseId, authorId: author.id, idempotencyKey } };
  const existing = await prisma.message.findUnique({
    where: uniqueKey,
    include: { author: true },
  });
  if (existing) {
    const view = (await annotateAlertIssues([await messageViewWithRole(existing)], author.id))[0]!;
    return { view, replayed: true };
  }

  let message: MessageWithAuthor;
  try {
    message = await prisma.message.create({
      data: { caseId, authorId: author.id, idempotencyKey, sourceLang, sourceText, citedFileId },
      include: { author: true },
    });
  } catch (error) {
    // Concurrent retry lost the unique-constraint race: return the winner's row.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.message.findUniqueOrThrow({
        where: uniqueKey,
        include: { author: true },
      });
      return { view: (await annotateAlertIssues([await messageViewWithRole(winner)], author.id))[0]!, replayed: true };
    }
    throw error;
  }
  await recordAudit(prisma, {
    actorId: author.id,
    action: "message.send",
    result: "success",
    targetType: "message",
    targetId: message.id,
    caseId,
  });
  const view = await messageViewWithRole(await runPipeline(message));
  return { view: (await annotateAlertIssues([view], author.id))[0]!, replayed: false };
}

function isLawyerVietnamese(message: MessageWithAuthor): boolean {
  return message.author.globalRole === "lawyer" && message.sourceLang === "vi";
}

async function runPipeline(message: MessageWithAuthor): Promise<MessageWithAuthor> {
  await prisma.message.update({ where: { id: message.id }, data: { status: "checking" } });
  let result;
  try {
    result = normalizeCheckResult(await getMessageChecker().check(message));
  } catch {
    // REQ-MSG-03: check failure is a distinct state, never auto-published.
    // The state change and one content-free alert per reviewer (kind
    // check_failed_alert) commit in the same transaction.
    return prisma.$transaction(async (tx) => {
      const failed = await tx.message.update({
        where: { id: message.id },
        data: { status: "check_failed" },
        include: { author: true },
      });
      await registerCheckFailedAlerts(tx, {
        caseId: message.caseId,
        targetId: message.id,
        authorId: message.authorId,
      });
      return failed;
    });
  }
  // A lawyer's Vietnamese message publishes without coordinator review
  // (user decision 2026-10-22). Other authors, and a lawyer writing in
  // another language, still stop on an explicit retainer-fee inquiry.
  if (result.outcome === "needs_review" && !isLawyerVietnamese(message)) {
    try {
      return await holdForReview(message, result.reason);
    } catch {
      // Registration failure must not leave a held message without a task
      // (or vice versa); fail safe like any other check-stage failure.
      return prisma.message.update({
        where: { id: message.id },
        data: { status: "check_failed" },
        include: { author: true },
      });
    }
  }
  return publishMessage(message.id);
}

// REQ-NTF-07 (registration part): the hold, the review task, and one alert
// per recipient land in one transaction, so there is never a pending_review
// message without a task nor a task without its alert records.
async function holdForReview(
  message: MessageWithAuthor,
  reason: string | null,
): Promise<MessageWithAuthor> {
  return prisma.$transaction(async (tx) => {
    const held = await tx.message.update({
      where: { id: message.id },
      data: { status: "pending_review" },
      include: { author: true },
    });
    const task = await tx.reviewTask.create({
      data: {
        caseId: message.caseId,
        targetType: "message",
        targetId: message.id,
        reason: reason ?? "unspecified",
      },
    });
    await registerHoldAlerts(tx, {
      caseId: message.caseId,
      reviewTaskId: task.id,
      authorId: message.authorId,
    });
    return held;
  });
}

// T05/T07 reuse this for reviewer-approved releases.
export async function publishMessage(messageId: string): Promise<MessageWithAuthor> {
  const published = await prisma.message.update({
    where: { id: messageId },
    data: { status: "published", publishedAt: new Date() },
    include: { author: true },
  });
  publishToCase(
    published.caseId,
    "message",
    JSON.stringify({ message: await messageViewWithRole(published) }),
  );
  return published;
}

export type ReadingMode = "auto" | "manual";

export type MessageView = ReturnType<typeof toMessageView> & { reviewAlertIssue: boolean };

export type MessageListView = MessageView & {
  translation: TranslationView | null;
  files: Array<ReturnType<typeof toFileView>>;
  file: ReturnType<typeof toFileView> | null;
  citedFile: { id: string; originalName: string } | null;
};

// REQ-NTF-12: when a held message has no live alert (no valid channel, all
// alerts failed), the anomaly is visible to the submitter on their own
// message views, alongside the review-queue flag for coordinators.
async function annotateAlertIssues(
  views: Array<ReturnType<typeof toMessageView>>,
  userId: string,
): Promise<Array<ReturnType<typeof toMessageView> & { reviewAlertIssue: boolean }>> {
  const heldIds = views
    .filter((v) => v.authorId === userId && v.status === "pending_review")
    .map((v) => v.id);
  const issueMessageIds = new Set<string>();
  if (heldIds.length > 0) {
    const tasks = await prisma.reviewTask.findMany({
      where: { targetType: "message", targetId: { in: heldIds }, status: "open" },
      select: { id: true, targetId: true },
    });
    const issueTaskIds = await listAlertIssueReviewTaskIds(tasks.map((t) => t.id));
    for (const task of tasks) {
      if (issueTaskIds.has(task.id)) issueMessageIds.add(task.targetId);
    }
  }
  return views.map((v) => ({ ...v, reviewAlertIssue: issueMessageIds.has(v.id) }));
}

async function attachMessageFiles<T extends { id: string }>(
  rows: MessageWithAuthor[],
  views: T[],
  user: User,
  isReviewer: boolean,
): Promise<
  Array<
    T & {
      files: Array<ReturnType<typeof toFileView>>;
      file: ReturnType<typeof toFileView> | null;
      citedFile: { id: string; originalName: string } | null;
    }
  >
> {
  const messageIds = rows.map((row) => row.id);
  const citedIds = rows.flatMap((row) => (row.citedFileId ? [row.citedFileId] : []));
  const files =
    messageIds.length === 0
      ? []
      : await prisma.file.findMany({
          where: {
            OR: [
              { messageId: { in: messageIds } },
              ...(citedIds.length > 0 ? [{ id: { in: citedIds } }] : []),
            ],
          },
          include: { uploader: true, attachmentPage: true },
          orderBy: { createdAt: "asc" },
        });
  const byMessage = new Map<string, Array<(typeof files)[number]>>();
  const byId = new Map(files.map((file) => [file.id, file]));
  for (const file of files) {
    if (!file.messageId) continue;
    const list = byMessage.get(file.messageId) ?? [];
    list.push(file);
    byMessage.set(file.messageId, list);
  }
  return views.map((view, index) => {
    const row = rows[index]!;
    const sent = (byMessage.get(row.id) ?? [])
      .filter((file) => fileVisibleTo(file, user.id, isReviewer))
      .map((file) => toFileView(file));
    const cited = row.citedFileId ? byId.get(row.citedFileId) : undefined;
    return {
      ...view,
      files: sent,
      file: sent[0] ?? null,
      citedFile:
        cited && fileVisibleTo(cited, user.id, isReviewer)
          ? { id: cited.id, originalName: cited.originalName }
          : null,
    };
  });
}

export async function listMessages(
  caseId: string,
  user: User,
  after: string | null,
  mode: ReadingMode = "auto",
): Promise<MessageListView[]> {
  const member = await requireCaseMember(caseId, user);
  const isReviewer = member.memberRole === "coordinator" && member.canReview;
  if (after) return backfillMessages(caseId, user, after, mode, isReviewer);

  // REQ-MSG-03: receivers see published only; the author also sees their own
  // pending/returned/rejected states (REQ-MSG-06).
  const rows = await prisma.message.findMany({
    where: { caseId, OR: [{ status: "published" }, { authorId: user.id }] },
    include: { author: true },
    orderBy: { seq: "asc" },
  });
  const latestPublished = [...rows].reverse().find((m) => m.status === "published");
  if (latestPublished) await advanceLastRead(caseId, user.id, latestPublished);
  const views = await annotateAlertIssues(await viewsFor(rows), user.id);
  const translated = await attachTranslations(views, user, mode);
  return attachMessageFiles(rows, translated, user, isReviewer);
}

// REQ-MSG-05: incremental backfill by last received message id. The cursor is
// (published_at, id) so a message published late (post-review, T05) still
// surfaces after older cursors — no loss, no duplication.
async function backfillMessages(
  caseId: string,
  user: User,
  afterId: string,
  mode: ReadingMode,
  isReviewer: boolean,
): Promise<MessageListView[]> {
  const cursor = await prisma.message.findFirst({
    where: { id: afterId, caseId, status: "published" },
  });
  if (!cursor?.publishedAt) throw new ApiError(400, "invalid_cursor");
  const rows = await prisma.message.findMany({
    where: {
      caseId,
      status: "published",
      OR: [
        { publishedAt: { gt: cursor.publishedAt } },
        { publishedAt: cursor.publishedAt, id: { gt: cursor.id } },
      ],
    },
    include: { author: true },
    orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
  });
  const views = await annotateAlertIssues(await viewsFor(rows), user.id);
  const translated = await attachTranslations(views, user, mode);
  return attachMessageFiles(rows, translated, user, isReviewer);
}

// REQ-MSG-07: reading the message list advances the member's own read
// position; the position is never shared with other members.
async function advanceLastRead(caseId: string, userId: string, latest: Message): Promise<void> {
  const member = await prisma.caseMember.findUnique({
    where: { caseId_userId: { caseId, userId } },
  });
  if (!member) return;
  if (member.lastReadMessageId) {
    if (member.lastReadMessageId === latest.id) return;
    const lastRead = await prisma.message.findUnique({
      where: { id: member.lastReadMessageId },
    });
    if (lastRead?.publishedAt && latest.publishedAt) {
      const newer =
        latest.publishedAt > lastRead.publishedAt ||
        (latest.publishedAt.getTime() === lastRead.publishedAt.getTime() &&
          latest.id > lastRead.id);
      if (!newer) return;
    }
  }
  await prisma.caseMember.update({
    where: { caseId_userId: { caseId, userId } },
    data: { lastReadMessageId: latest.id },
  });
}
