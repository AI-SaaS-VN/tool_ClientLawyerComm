import type { AttachmentPage, Prisma, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { detectSourceLang } from "@/modules/messages/lang";
import { backoffDelayMs } from "@/modules/notifications/dedupe";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember } from "@/server/guards/case-guards";
import { getLlmTranslationProvider, getLlmVisionProvider } from "@/server/providers/llm";
import { LlmFailure } from "@/server/providers/llm/interface";
import { getStorageProvider } from "@/server/providers/storage";

import { extractLocalText } from "./extract-text";

export interface AttachmentDirection {
  sourceLang: string;
  targetLang: string;
}

// REQ-ATT-02: the direction follows the extracted text — Chinese becomes
// Vietnamese, Vietnamese becomes Traditional Chinese. Text that is neither
// yields no page (SPEC v0.15 clarification).
export function planAttachmentDirection(sourceText: string): AttachmentDirection | null {
  const detected = detectSourceLang(sourceText);
  if (detected === "vi") return { sourceLang: "vi", targetLang: "zh-Hant" };
  if (detected === "zh-Hans") return { sourceLang: "zh-Hans", targetLang: "vi" };
  return null;
}

export type AttachmentRowState = "none" | "pending" | "ready" | "unavailable";

// The file row shows 打开附件翻译 only for a ready page; a pending one says
// it is being prepared; extraction failure is written on the row (REQ-ATT-04).
export function attachmentRowState(status: string | null | undefined): AttachmentRowState {
  if (!status) return "none";
  if (status === "ready") return "ready";
  if (status === "pending" || status === "processing") return "pending";
  return "unavailable";
}

// A page row is queued when the file publishes (both publish paths call this
// inside the publish transaction, so a published file always has its row).
export async function enqueueAttachmentPage(
  tx: Prisma.TransactionClient,
  fileId: string,
): Promise<void> {
  await tx.attachmentPage.upsert({
    where: { fileId },
    create: { fileId },
    update: {},
  });
}

export interface AttachmentPageView {
  fileId: string;
  caseId: string;
  originalName: string;
  sourceLang: string;
  sourceText: string;
  targetLang: string;
  translatedText: string;
}

// REQ-ATT-03: anyone who can download the published original can open the
// page — an active member of the case, with the file published. Unpublished
// files and missing/incomplete pages are a plain 404, revealing nothing.
export async function getAttachmentPageView(
  fileId: string,
  user: User,
): Promise<AttachmentPageView> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "not_found");
  await requireCaseMember(file.caseId, user);
  if (file.status !== "published") throw new ApiError(404, "not_found");
  const page = await prisma.attachmentPage.findUnique({ where: { fileId } });
  if (!page || page.status !== "ready" || !page.sourceText || !page.translatedText) {
    throw new ApiError(404, "not_found");
  }
  return {
    fileId: file.id,
    caseId: file.caseId,
    originalName: file.originalName,
    sourceLang: page.sourceLang!,
    sourceText: page.sourceText,
    targetLang: page.targetLang!,
    translatedText: page.translatedText,
  };
}

export const MAX_ATTACHMENT_PAGE_ATTEMPTS = 3;
// A worker crash leaves a row in processing; after this grace it is due again.
const PROCESSING_STALE_MS = 10 * 60_000;

export async function findDueAttachmentPages(now: Date): Promise<AttachmentPage[]> {
  return prisma.attachmentPage.findMany({
    where: {
      OR: [
        { status: "pending", OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] },
        { status: "processing", updatedAt: { lte: new Date(now.getTime() - PROCESSING_STALE_MS) } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

function kindFromMime(mime: string): "pdf" | "docx" | "jpg" | "png" | null {
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return null;
}

// The worker must know whether the next step crosses the provider boundary so
// it can spend one paced LLM slot (the account is capped at 3 RPM, F17).
// Local PDF/DOCX extraction costs nothing; image reading and the translation
// itself do.
export async function attachmentPageNextStepUsesLlm(row: AttachmentPage): Promise<boolean> {
  if (row.sourceText) return true;
  const file = await prisma.file.findUnique({ where: { id: row.fileId } });
  if (!file) return false;
  const kind = kindFromMime(file.mime);
  return kind === "jpg" || kind === "png";
}

async function sharedCopyBytes(fileId: string): Promise<Buffer> {
  const variant = await prisma.fileVariant.findFirst({
    where: { fileId, kind: "shared_copy" },
    orderBy: { version: "desc" },
  });
  if (!variant) throw new ApiError(404, "not_found");
  return getStorageProvider().getObject(variant.storageKey);
}

async function finishTerminal(
  row: AttachmentPage,
  status: "ready" | "no_text" | "failed",
  data: Prisma.AttachmentPageUpdateInput = {},
): Promise<AttachmentPage> {
  const finished = await prisma.attachmentPage.update({
    where: { id: row.id },
    data: { status, ...data },
  });
  await recordAudit(prisma, {
    action: "attachment_page.run",
    result: status === "ready" ? "success" : "failed",
    targetType: "file",
    targetId: row.fileId,
    caseId: (await prisma.file.findUniqueOrThrow({ where: { id: row.fileId } })).caseId,
    meta: { status },
  });
  return finished;
}

async function failOrRetry(
  row: AttachmentPage,
  kind: string,
  error?: unknown,
): Promise<AttachmentPage> {
  console.error("attachment_page_failed", {
    kind,
    attempts: row.attempts + 1,
    message: error instanceof Error ? error.message : String(error ?? ""),
  });
  // Rate limiting is external congestion, not a failure of this row: wait two
  // minutes and retry without spending the attempt budget.
  if (kind.endsWith("rate_limited")) {
    return prisma.attachmentPage.update({
      where: { id: row.id },
      data: { status: "pending", nextRetryAt: new Date(Date.now() + 2 * 60_000) },
    });
  }
  const attempts = row.attempts + 1;
  if (attempts >= MAX_ATTACHMENT_PAGE_ATTEMPTS) {
    return finishTerminal(row, "failed", { attempts });
  }
  return prisma.attachmentPage.update({
    where: { id: row.id },
    data: {
      status: "pending",
      attempts,
      nextRetryAt: new Date(Date.now() + (backoffDelayMs(attempts) ?? 15 * 60_000)),
    },
  });
}

// One queued step: extraction first (local for selectable PDF/DOCX, the
// existing Kimi for JPG/PNG photos and scans, REQ-ATT-04), then the single
// translation (REQ-ATT-02). A provider or storage fault re-queues the row
// with backoff until the attempt budget is spent, then it stays failed.
export async function runAttachmentPageStep(row: AttachmentPage): Promise<AttachmentPage> {
  const claimed = await prisma.attachmentPage.updateMany({
    where: { id: row.id, status: { in: ["pending", "processing"] } },
    data: { status: "processing" },
  });
  if (claimed.count === 0) {
    return prisma.attachmentPage.findUniqueOrThrow({ where: { id: row.id } });
  }
  const current = await prisma.attachmentPage.findUniqueOrThrow({ where: { id: row.id } });

  const file = await prisma.file.findUnique({ where: { id: row.fileId } });
  // The page only exists for a published file (REQ-ATT-03).
  if (!file || file.status !== "published") {
    return finishTerminal(current, "failed");
  }
  const kind = kindFromMime(file.mime);
  if (!kind) return finishTerminal(current, "failed");

  if (!current.sourceText) {
    let data: Buffer;
    try {
      data = await sharedCopyBytes(file.id);
    } catch (error) {
      return failOrRetry(current, "extract:storage", error);
    }
    let text: string;
    if (kind === "pdf" || kind === "docx") {
      // Local extraction is deterministic over the same bytes: a parse error
      // means this file has no extractable text — no retry, straight to
      // no_text (REQ-ATT-04: extraction failure creates no page).
      try {
        text = await extractLocalText(kind, data);
      } catch {
        return finishTerminal(current, "no_text");
      }
    } else {
      try {
        text = (
          await getLlmVisionProvider().readImageText({
            dataBase64: data.toString("base64"),
            mime: file.mime,
          })
        ).text.trim();
      } catch (error) {
        const failureKind = error instanceof LlmFailure ? error.kind : "unknown";
        return failOrRetry(current, `extract:${failureKind}`, error);
      }
    }
    const direction = text ? planAttachmentDirection(text) : null;
    if (!direction) {
      // No extractable text, or text in neither Chinese nor Vietnamese.
      return finishTerminal(current, "no_text");
    }
    return prisma.attachmentPage.update({
      where: { id: row.id },
      data: {
        status: "pending",
        sourceText: text,
        sourceLang: direction.sourceLang,
        targetLang: direction.targetLang,
      },
    });
  }

  // REQ-TR-06: the payload is exactly the extracted text and the two language
  // codes — nothing else crosses the provider boundary.
  const provider = getLlmTranslationProvider();
  try {
    const result = await provider.translate({
      text: current.sourceText,
      sourceLang: current.sourceLang!,
      targetLang: current.targetLang!,
    });
    return finishTerminal(current, "ready", { translatedText: result.text });
  } catch (error) {
    const failureKind = error instanceof LlmFailure ? error.kind : "unknown";
    return failOrRetry(current, `translate:${failureKind}`, error);
  }
}
