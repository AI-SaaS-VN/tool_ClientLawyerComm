import { createHash, randomUUID } from "node:crypto";

import type { File as FileRow, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { findRuleHits } from "@/modules/moderation/rules";
import { recordAudit } from "@/server/audit/log";
import {
  requireCaseMember,
  requireCaseReviewer,
  requireWritableCase,
} from "@/server/guards/case-guards";
import { registerCheckFailedAlerts, registerHoldAlerts } from "@/server/jobs/queue";
import { getFileScanner } from "@/server/providers/scanner";
import { getStorageProvider } from "@/server/providers/storage";

import { MAX_FILE_BYTES, detectFileType } from "./file-type";

const MAX_NAME_CHARS = 200;

type FileWithUploader = FileRow & { uploader: User };

// Never include storage keys (REQ-FILE-02 — no object addresses through any
// API) or registered contact channels (REQ-PM-09).
export function toFileView(file: FileWithUploader) {
  return {
    id: file.id,
    caseId: file.caseId,
    uploaderId: file.uploaderId,
    uploaderDisplayName: file.uploader.displayName,
    status: file.status,
    originalName: file.originalName,
    mime: file.mime,
    sizeBytes: file.sizeBytes,
    publishedAt: file.publishedAt,
    createdAt: file.createdAt,
  };
}

// REQ-FILE-01/02: type and size are validated before anything is stored;
// accepted bytes land directly in the private quarantine prefix, and the
// original hash/uploader/time are recorded once (REQ-FILE-04). Every clean
// file then waits for coordinator confirmation (REQ-FILE-05) — there is no
// auto-publish path.
export async function uploadFile(
  caseId: string,
  user: User,
  form: FormData,
): Promise<ReturnType<typeof toFileView>> {
  await requireCaseMember(caseId, user);
  await requireWritableCase(caseId);

  const part = form.get("file");
  if (!(part instanceof File)) throw new ApiError(400, "file_required");
  const data = Buffer.from(await part.arrayBuffer());
  if (data.length === 0) throw new ApiError(400, "empty_file");
  if (data.length > MAX_FILE_BYTES) throw new ApiError(413, "file_too_large");
  const type = detectFileType(data);
  if (!type) throw new ApiError(400, "unsupported_file_type");
  const originalName = [...(part.name ?? "").trim()].slice(0, MAX_NAME_CHARS).join("") || "unnamed";

  const fileId = randomUUID();
  const storageKey = `quarantine/${caseId}/${fileId}/original`;
  await getStorageProvider().putObject(storageKey, data);

  const file = await prisma.$transaction(async (tx) => {
    const created = await tx.file.create({
      data: {
        id: fileId,
        caseId,
        uploaderId: user.id,
        origHash: createHash("sha256").update(data).digest("hex"),
        storageKey,
        mime: type.mime,
        sizeBytes: data.length,
        originalName,
      },
      include: { uploader: true },
    });
    await tx.fileVariant.create({
      data: { fileId, kind: "original", version: 1, storageKey },
    });
    return created;
  });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "file.upload",
    result: "success",
    targetType: "file",
    targetId: file.id,
    caseId,
    meta: { sizeBytes: file.sizeBytes, mime: file.mime },
  });
  return toFileView(await runScanPipeline(file));
}

// SPEC 8.1: uploaded → scanning → (clean → pending_review) | (any failure →
// check_failed). The scan pass and the hold/alert registrations each commit
// in one transaction, mirroring the message pipeline.
async function runScanPipeline(file: FileWithUploader): Promise<FileWithUploader> {
  await prisma.file.update({ where: { id: file.id }, data: { status: "scanning" } });
  let clean = false;
  try {
    const verdict = await getFileScanner().scan({
      storageKey: file.storageKey,
      mime: file.mime,
      sizeBytes: file.sizeBytes,
      sha256: file.origHash,
    });
    clean = verdict.outcome === "clean";
  } catch {
    clean = false;
  }
  if (!clean) return markCheckFailed(file);

  // REQ-FILE-07: the file name goes through the deterministic content rules.
  const hits = findRuleHits(file.originalName);
  const reason =
    hits.length > 0
      ? `rule:file_name:${[...new Set(hits.map((hit) => hit.category))].join(",")}`
      : "file_publish_review";
  try {
    return await prisma.$transaction(async (tx) => {
      const held = await tx.file.update({
        where: { id: file.id },
        data: { status: "pending_review" },
        include: { uploader: true },
      });
      const task = await tx.reviewTask.create({
        data: { caseId: file.caseId, targetType: "file", targetId: file.id, reason },
      });
      await registerHoldAlerts(tx, {
        caseId: file.caseId,
        reviewTaskId: task.id,
        authorId: file.uploaderId,
      });
      return held;
    });
  } catch {
    return markCheckFailed(file);
  }
}

// REQ-FILE-08: check_failed never publishes; the state change and one
// content-free alert per reviewer commit together.
async function markCheckFailed(file: FileWithUploader): Promise<FileWithUploader> {
  return prisma.$transaction(async (tx) => {
    const failed = await tx.file.update({
      where: { id: file.id },
      data: { status: "check_failed" },
      include: { uploader: true },
    });
    await registerCheckFailedAlerts(tx, {
      caseId: file.caseId,
      targetId: file.id,
      authorId: file.uploaderId,
    });
    return failed;
  });
}

// Visibility invariant (AC06): receivers see published files only; the
// uploader always sees their own; can_review coordinators additionally see
// files awaiting scan/review and failed ones (REQ-FILE-08).
export async function listCaseFiles(
  caseId: string,
  user: User,
): Promise<Array<ReturnType<typeof toFileView>>> {
  const member = await requireCaseMember(caseId, user);
  const isReviewer = member.memberRole === "coordinator" && member.canReview;
  const files = await prisma.file.findMany({
    where: {
      caseId,
      OR: [
        { status: "published" },
        { uploaderId: user.id },
        ...(isReviewer
          ? [{ status: { in: ["uploaded", "scanning", "pending_review", "check_failed"] } }]
          : []),
      ],
    },
    include: { uploader: true },
    orderBy: { createdAt: "asc" },
  });
  return files.map(toFileView);
}

// REQ-FILE-06: every download re-validates membership and publish state —
// there are no persistent direct links to invalidate because every request
// is authorized again. Members download the published shared copy
// (REQ-FILE-04); the uploader can always retrieve their own original;
// can_review coordinators can pull quarantined content for review.
export async function downloadFile(
  fileId: string,
  user: User,
): Promise<{ data: Buffer; mime: string; name: string }> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "not_found");
  const member = await requireCaseMember(file.caseId, user);
  const isReviewer = member.memberRole === "coordinator" && member.canReview;

  let variantKind: "original" | "shared_copy";
  if (file.status === "published") {
    variantKind = "shared_copy";
  } else if (file.uploaderId === user.id || isReviewer) {
    variantKind = "original";
  } else {
    throw new ApiError(404, "not_found");
  }
  const variant = await prisma.fileVariant.findFirst({
    where: { fileId: file.id, kind: variantKind },
    orderBy: { version: "desc" },
  });
  if (!variant) throw new ApiError(404, "not_found");
  // REQ-OPS-01: every authorized download is auditable; the variant kind
  // (original/shared_copy) is recorded, never the bytes or storage key.
  await recordAudit(prisma, {
    actorId: user.id,
    action: "file.download",
    result: "success",
    targetType: "file",
    targetId: file.id,
    caseId: file.caseId,
    meta: { variantKind },
  });
  return {
    data: await getStorageProvider().getObject(variant.storageKey),
    mime: file.mime,
    name: file.originalName,
  };
}

// REQ-FILE-08: a can_review coordinator re-runs the scan on a check_failed
// file. A clean result still goes through pending_review — no skip path to
// published.
export async function retryFileScan(
  fileId: string,
  user: User,
): Promise<ReturnType<typeof toFileView>> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { uploader: true },
  });
  if (!file) throw new ApiError(404, "not_found");
  await requireCaseReviewer(file.caseId, user);
  if (file.status !== "check_failed") throw new ApiError(409, "scan_not_retryable");
  await recordAudit(prisma, {
    actorId: user.id,
    action: "file.scan_retry",
    result: "success",
    targetType: "file",
    targetId: file.id,
    caseId: file.caseId,
  });
  return toFileView(await runScanPipeline(file));
}

// REQ-FILE-08: a can_review coordinator rejects a check_failed file; it
// stays invisible to the receiver and can never be published afterwards.
export async function rejectFailedFile(fileId: string, user: User): Promise<void> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "not_found");
  await requireCaseReviewer(file.caseId, user);
  if (file.status !== "check_failed") throw new ApiError(409, "not_rejectable");
  await prisma.file.update({ where: { id: file.id }, data: { status: "rejected" } });
  await recordAudit(prisma, {
    actorId: user.id,
    action: "file.reject",
    result: "success",
    targetType: "file",
    targetId: file.id,
    caseId: file.caseId,
  });
}

// Review-console hook (T07 decision API): on approve, the shared copy is
// stored separately from the immutable original BEFORE the decision
// transaction, so a storage failure leaves the task open.
export async function copySharedVersion(
  file: FileRow,
): Promise<{ storageKey: string; version: number }> {
  if (file.status !== "pending_review") throw new ApiError(409, "file_not_reviewable");
  const existing = await prisma.fileVariant.count({
    where: { fileId: file.id, kind: "shared_copy" },
  });
  const version = existing + 1;
  const storageKey = `shared/${file.caseId}/${file.id}/v${version}`;
  await getStorageProvider().copyObject(file.storageKey, storageKey);
  return { storageKey, version };
}
