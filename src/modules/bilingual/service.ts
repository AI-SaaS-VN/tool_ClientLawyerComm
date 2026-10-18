import { createHash, randomUUID } from "node:crypto";

import type { DocxJob, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { detectSourceLang } from "@/modules/messages/lang";
import { recordAudit } from "@/server/audit/log";
import { requireCaseMember, requireWritableCase } from "@/server/guards/case-guards";
import { registerHoldAlerts } from "@/server/jobs/queue";
import { getLlmTranslationProvider } from "@/server/providers/llm";
import { LlmFailure } from "@/server/providers/llm/interface";
import { getStorageProvider } from "@/server/providers/storage";

import {
  MAX_PAGES,
  buildBilingualDocx,
  buildNumberedBatch,
  estimatePages,
  parseDocxParagraphs,
  parseNumberedBatch,
  readDocxParts,
} from "./docx";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
// Paragraphs per provider call; the worker paces calls (Kimi org cap: 3 RPM).
const BATCH_SIZE = 8;
const MAX_ATTEMPTS = 3;

export interface BilingualJobView {
  id: string;
  status: string;
  error: string | null;
  outputFileId: string | null;
  paragraphCount: number | null;
  pageEstimate: number | null;
  createdAt: Date;
}

function toJobView(job: DocxJob): BilingualJobView {
  return {
    id: job.id,
    status: job.status,
    error: job.error,
    outputFileId: job.outputFileId,
    paragraphCount: job.paragraphCount,
    pageEstimate: job.pageEstimate,
    createdAt: job.createdAt,
  };
}

async function requireFileAccess(fileId: string, user: User) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "not_found");
  const member = await requireCaseMember(file.caseId, user);
  const isReviewer = member.memberRole === "coordinator" && member.canReview;
  const visible =
    file.status === "published" || file.uploaderId === user.id || isReviewer;
  if (!visible) throw new ApiError(404, "not_found");
  return file;
}

// REQ-DOC-01: explicit user request; the file must be a DOCX the user can
// access. One active job per file.
export async function requestBilingualConversion(
  fileId: string,
  user: User,
): Promise<BilingualJobView> {
  const file = await requireFileAccess(fileId, user);
  await requireWritableCase(file.caseId);
  if (file.mime !== DOCX_MIME) throw new ApiError(400, "not_docx");
  const active = await prisma.docxJob.findFirst({
    where: { fileId, status: { in: ["queued", "processing"] } },
  });
  if (active) throw new ApiError(409, "job_active");
  const job = await prisma.docxJob.create({
    data: { caseId: file.caseId, fileId, requesterId: user.id },
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "bilingual.request",
    result: "success",
    targetType: "file",
    targetId: fileId,
    caseId: file.caseId,
  });
  return toJobView(job);
}

// The latest job's status is visible to anyone who can see the file.
export async function getBilingualJobView(
  fileId: string,
  user: User,
): Promise<BilingualJobView | null> {
  const file = await requireFileAccess(fileId, user);
  const job = await prisma.docxJob.findFirst({
    where: { fileId: file.id },
    orderBy: { createdAt: "desc" },
  });
  return job ? toJobView(job) : null;
}

export async function findDueDocxJobs(now: Date): Promise<DocxJob[]> {
  return prisma.docxJob.findMany({
    where: {
      status: { in: ["queued", "processing"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

interface JobProgress {
  paragraphs: string[];
  translated: Array<string | null>;
  model: string | null;
}

function readProgress(job: DocxJob): JobProgress | null {
  const raw = job.progress;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const progress = raw as unknown as JobProgress;
  if (!Array.isArray(progress.paragraphs) || !Array.isArray(progress.translated)) return null;
  return progress;
}

// One step per call: local extraction first (no provider call), then one
// paced translation batch per step, then document assembly. The output file
// enters the normal publish review (REQ-DOC-05).
export async function runBilingualJobStep(row: DocxJob): Promise<DocxJob> {
  const job = await prisma.docxJob.findUniqueOrThrow({ where: { id: row.id } });

  try {
    const file = await prisma.file.findUnique({ where: { id: job.fileId } });
    if (!file) throw new LlmFailure("format");

    let progress = readProgress(job);
    if (!progress) {
      const variant = await prisma.fileVariant.findFirst({
        where: { fileId: file.id, kind: "original" },
        orderBy: { version: "desc" },
      });
      if (!variant) throw new LlmFailure("format");
      const data = await getStorageProvider().getObject(variant.storageKey);
      const parts = await readDocxParts(data);
      const parsed = parseDocxParagraphs(parts.documentXml, parts);
      if (parsed.unsupported.length > 0) {
        return await prisma.docxJob.update({
          where: { id: job.id },
          data: { status: "rejected_unsupported", error: parsed.unsupported.join(",") },
        });
      }
      if (parsed.paragraphs.length === 0) {
        return await prisma.docxJob.update({
          where: { id: job.id },
          data: { status: "rejected_unsupported", error: "empty" },
        });
      }
      const sample = parsed.paragraphs.slice(0, 10).join("\n");
      const detected = detectSourceLang(sample);
      const sourceLang = detected === "vi" ? "vi" : detected === "zh-Hans" ? "zh-Hans" : null;
      if (!sourceLang) {
        return await prisma.docxJob.update({
          where: { id: job.id },
          data: { status: "rejected_lang", error: detected },
        });
      }
      const targetLang = sourceLang === "vi" ? "zh-Hans" : "vi";
      const pageEstimate = estimatePages(parsed.paragraphs);
      if (pageEstimate > MAX_PAGES) {
        return await prisma.docxJob.update({
          where: { id: job.id },
          data: {
            status: "rejected_too_long",
            error: `pages>${MAX_PAGES}`,
            paragraphCount: parsed.paragraphs.length,
            pageEstimate,
          },
        });
      }
      progress = {
        paragraphs: parsed.paragraphs,
        translated: parsed.paragraphs.map(() => null),
        model: null,
      };
      await prisma.docxJob.update({
        where: { id: job.id },
        data: {
          status: "processing",
          sourceLang,
          targetLang,
          paragraphCount: parsed.paragraphs.length,
          pageEstimate,
          progress: progress as object,
        },
      });
    }

    const missing: number[] = [];
    for (let i = 0; i < progress.paragraphs.length; i += 1) {
      if (progress.translated[i] === null) missing.push(i);
    }

    if (missing.length > 0) {
      const batch = missing.slice(0, BATCH_SIZE);
      const provider = getLlmTranslationProvider();
      const result = await provider.translate({
        text: buildNumberedBatch(progress.paragraphs, batch),
        sourceLang: job.sourceLang ?? "zh-Hans",
        targetLang: job.targetLang ?? "vi",
      });
      const parsed = parseNumberedBatch(result.text, batch);
      if (!parsed) throw new LlmFailure("format");
      const translated = [...progress.translated];
      for (const [index, text] of parsed) translated[index] = text;
      progress = { ...progress, translated, model: result.model };
      const doneNow = translated.every((t) => t !== null);
      if (!doneNow) {
        return await prisma.docxJob.update({
          where: { id: job.id },
          data: { progress: progress as object },
        });
      }
    }

    const pairs = progress.paragraphs.map((source, index) => ({
      index,
      source,
      translated: progress!.translated[index]!,
    }));
    const data = await buildBilingualDocx(pairs, {
      sourceName: file.originalName,
      sourceLang: job.sourceLang ?? "zh-Hans",
      targetLang: job.targetLang ?? "vi",
      model: progress.model ?? "unknown",
      generatedAt: new Date().toISOString(),
    });

    const outputFileId = randomUUID();
    const baseName = file.originalName.replace(/\.docx$/i, "");
    const outputName = `${baseName}-中越对照.docx`;
    const storageKey = `quarantine/${file.caseId}/${outputFileId}/original`;
    await getStorageProvider().putObject(storageKey, data);

    await prisma.$transaction(async (tx) => {
      await tx.file.create({
        data: {
          id: outputFileId,
          caseId: file.caseId,
          uploaderId: job.requesterId,
          status: "pending_review",
          origHash: createHash("sha256").update(data).digest("hex"),
          storageKey,
          mime: DOCX_MIME,
          sizeBytes: data.length,
          originalName: outputName,
        },
      });
      await tx.fileVariant.create({
        data: { fileId: outputFileId, kind: "original", version: 1, storageKey },
      });
      // REQ-DOC-05: the output goes through publish review before the other
      // party can see it.
      const task = await tx.reviewTask.create({
        data: {
          caseId: file.caseId,
          targetType: "file",
          targetId: outputFileId,
          reason: "bilingual_output",
        },
      });
      await registerHoldAlerts(tx, {
        caseId: file.caseId,
        reviewTaskId: task.id,
        authorId: job.requesterId,
      });
    });
    await recordAudit(prisma, {
      actorId: job.requesterId,
      action: "bilingual.done",
      result: "success",
      targetType: "file",
      targetId: outputFileId,
      caseId: file.caseId,
      meta: { sourceFileId: file.id, paragraphs: pairs.length, model: progress.model },
    });
    return await prisma.docxJob.update({
      where: { id: job.id },
      data: { status: "done", outputFileId, progress: progress as object },
    });
  } catch (error) {
    const kind = error instanceof LlmFailure ? error.kind : "unknown";
    console.error("bilingual_job_failed", {
      kind,
      attempts: row.attempts + 1,
      message: error instanceof Error ? error.message : String(error ?? ""),
    });
    if (kind === "rate_limited") {
      return prisma.docxJob.update({
        where: { id: job.id },
        data: { status: "queued", nextRetryAt: new Date(Date.now() + 2 * 60_000) },
      });
    }
    const attempts = row.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return prisma.docxJob.update({
        where: { id: job.id },
        data: { status: "failed", attempts },
      });
    }
    return prisma.docxJob.update({
      where: { id: job.id },
      data: {
        status: "queued",
        attempts,
        nextRetryAt: new Date(Date.now() + attempts * 60_000),
      },
    });
  }
}
