import { Prisma, type Message, type User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getMessageChecker } from "@/modules/messages/check";
import { detectSourceLang } from "@/modules/messages/lang";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { publishToCase } from "@/server/sse/hub";

export const MESSAGE_MAX_CHARS = 4000;
const SOURCE_LANGS = new Set(["zh-Hans", "zh-Hant", "vi", "en"]);

type MessageWithAuthor = Message & { author: User };

// Never include registered contact channels (REQ-PM-09); the author is
// identified by display name only.
export function toMessageView(message: MessageWithAuthor) {
  return {
    id: message.id,
    caseId: message.caseId,
    authorId: message.authorId,
    authorDisplayName: message.author.displayName,
    sourceLang: message.sourceLang,
    sourceText: message.sourceText,
    status: message.status,
    publishedAt: message.publishedAt,
    createdAt: message.createdAt,
  };
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
): Promise<{ view: ReturnType<typeof toMessageView>; replayed: boolean }> {
  await requireCaseMember(caseId, author);
  await requireWritableCase(caseId);
  const idempotencyKey = readIdempotencyKey(headers);
  const sourceText = readSourceText(body);
  const sourceLang = readSourceLang(body, sourceText);

  const uniqueKey = { caseId_authorId_idempotencyKey: { caseId, authorId: author.id, idempotencyKey } };
  const existing = await prisma.message.findUnique({
    where: uniqueKey,
    include: { author: true },
  });
  if (existing) return { view: toMessageView(existing), replayed: true };

  let message: MessageWithAuthor;
  try {
    message = await prisma.message.create({
      data: { caseId, authorId: author.id, idempotencyKey, sourceLang, sourceText },
      include: { author: true },
    });
  } catch (error) {
    // Concurrent retry lost the unique-constraint race: return the winner's row.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.message.findUniqueOrThrow({
        where: uniqueKey,
        include: { author: true },
      });
      return { view: toMessageView(winner), replayed: true };
    }
    throw error;
  }
  // TODO(T11): audit (message received)
  return { view: toMessageView(await runPipeline(message)), replayed: false };
}

async function runPipeline(message: MessageWithAuthor): Promise<MessageWithAuthor> {
  await prisma.message.update({ where: { id: message.id }, data: { status: "checking" } });
  let outcome;
  try {
    outcome = await getMessageChecker().check(message);
  } catch {
    // REQ-MSG-03: check failure is a distinct state, never auto-published.
    // TODO(T07): content-free alert to the Coordinator.
    return prisma.message.update({
      where: { id: message.id },
      data: { status: "check_failed" },
      include: { author: true },
    });
  }
  if (outcome === "needs_review") {
    // TODO(T05): register the review task in the same transaction.
    return prisma.message.update({
      where: { id: message.id },
      data: { status: "pending_review" },
      include: { author: true },
    });
  }
  return publishMessage(message.id);
}

// T05/T07 reuse this for reviewer-approved releases.
export async function publishMessage(messageId: string): Promise<MessageWithAuthor> {
  const published = await prisma.message.update({
    where: { id: messageId },
    data: { status: "published", publishedAt: new Date() },
    include: { author: true },
  });
  publishToCase(published.caseId, "message", JSON.stringify({ message: toMessageView(published) }));
  return published;
}

export async function listMessages(
  caseId: string,
  user: User,
  after: string | null,
): Promise<Array<ReturnType<typeof toMessageView>>> {
  await requireCaseMember(caseId, user);
  if (after) return backfillMessages(caseId, after);

  // REQ-MSG-03: receivers see published only; the author also sees their own
  // pending/returned/rejected states (REQ-MSG-06).
  const rows = await prisma.message.findMany({
    where: { caseId, OR: [{ status: "published" }, { authorId: user.id }] },
    include: { author: true },
    orderBy: { seq: "asc" },
  });
  const latestPublished = [...rows].reverse().find((m) => m.status === "published");
  if (latestPublished) await advanceLastRead(caseId, user.id, latestPublished);
  return rows.map(toMessageView);
}

// REQ-MSG-05: incremental backfill by last received message id. The cursor is
// (published_at, id) so a message published late (post-review, T05) still
// surfaces after older cursors — no loss, no duplication.
async function backfillMessages(
  caseId: string,
  afterId: string,
): Promise<Array<ReturnType<typeof toMessageView>>> {
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
  return rows.map(toMessageView);
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
