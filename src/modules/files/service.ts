import { createHash, randomUUID } from "node:crypto";

import { Prisma, type File as FileRow, type User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { isExplicitFeeInquiry } from "@/modules/moderation/semantic";
import { recordAudit } from "@/server/audit/log";
import {
  requireCaseMember,
  requireCaseReviewer,
  requireWritableCase,
} from "@/server/guards/case-guards";
import { registerCheckFailedAlerts, registerHoldAlerts } from "@/server/jobs/queue";
import { getFileScanner } from "@/server/providers/scanner";
import { getStorageProvider } from "@/server/providers/storage";
import { publishToCase } from "@/server/sse/hub";

import { MAX_FILE_BYTES, detectFileType } from "./file-type";
import { attachmentRowState, enqueueAttachmentPage } from "./attachment-translation";

const MAX_NAME_CHARS = 200;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readMessageLink(caseId: string, user: User, form: FormData): Promise<string | null> {
  const raw = form.get("messageId");
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string" || !UUID_RE.test(raw)) throw new ApiError(400, "invalid_message");
  const message = await prisma.message.findFirst({ where: { id: raw, caseId } });
  if (!message || message.authorId !== user.id) throw new ApiError(404, "not_found");
  if (message.citedFileId) throw new ApiError(409, "message_already_cites_file");
  const taken = await prisma.file.findFirst({ where: { messageId: message.id } });
  if (taken) throw new ApiError(409, "message_has_file");
  return message.id;
}

type FileWithUploader = FileRow & { uploader: User; attachmentPage?: { status: string } | null };

// Never include storage keys (REQ-FILE-02 — no object addresses through any
// API) or registered contact channels (REQ-PM-09). attachmentState drives the
// 打开附件翻译 control and the extraction-failure note on the row (REQ-ATT-01/04).
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
    attachmentState: attachmentRowState(file.attachmentPage?.status),
    messageId: file.messageId,
  };
}

// Same visibility as listCaseFiles: published files, the uploader's own
// files, and in-progress files for a reviewing coordinator.
export function fileVisibleTo(
  file: { status: string; uploaderId: string },
  userId: string,
  isReviewer: boolean,
): boolean {
  if (file.status === "published" || file.uploaderId === userId) return true;
  return (
    isReviewer &&
    (file.status === "uploaded" ||
      file.status === "scanning" ||
      file.status === "pending_review" ||
      file.status === "check_failed")
  );
}

// REQ-FILE-01/02: type and size are validated before anything is stored;
// accepted bytes land directly in the private quarantine prefix, and the
// original hash/uploader/time are recorded once (REQ-FILE-04). A clean file
// is published immediately unless its name explicitly asks about the firm's
// litigation retainer fee.
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
  const messageId = await readMessageLink(caseId, user, form);

  const fileId = randomUUID();
  const storageKey = `quarantine/${caseId}/${fileId}/original`;
  await getStorageProvider().putObject(storageKey, data);

  let file: FileWithUploader;
  try {
    file = await prisma.$transaction(async (tx) => {
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
        messageId,
      },
      include: { uploader: true },
    });
    await tx.fileVariant.create({
      data: { fileId, kind: "original", version: 1, storageKey },
    });
    return created;
  });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "message_has_file");
    }
    throw error;
  }
  await recordAudit(prisma, {
    actorId: user.id,
    action: "file.upload",
    result: "success",
    targetType: "file",
    targetId: file.id,
    caseId,
    meta: { sizeBytes: file.sizeBytes, mime: file.mime },
  });
  const scanned = await runScanPipeline(file);
  if (scanned.messageId) {
    publishToCase(scanned.caseId, "message", JSON.stringify({ fileId: scanned.id }));
  }
  return toFileView(scanned);
}

// Clean files publish at once. A file name that explicitly asks about the
// firm's litigation retainer fee is the only hold. Scan failure stays
// check_failed and is never published.
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

  try {
    if (await isExplicitFeeInquiry(file.originalName, "zh-Hans")) {
      return await holdFileForReview(file, "semantic:fee_inquiry");
    }
    return await publishCleanFile(file);
  } catch {
    return markCheckFailed(file);
  }
}

async function holdFileForReview(
  file: FileWithUploader,
  reason: string,
): Promise<FileWithUploader> {
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

async function publishCleanFile(file: FileWithUploader): Promise<FileWithUploader> {
  const storageKey = `shared/${file.caseId}/${file.id}/v1`;
  try {
    await getStorageProvider().copyObject(file.storageKey, storageKey);
  } catch {
    return markCheckFailed(file);
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const published = await tx.file.update({
        where: { id: file.id },
        data: { status: "published", publishedAt: new Date() },
        include: { uploader: true },
      });
      await tx.fileVariant.create({
        data: {
          fileId: file.id,
          kind: "shared_copy",
          version: 1,
          storageKey,
          sourceVersion: 1,
        },
      });
      // T15 (REQ-ATT): queue the attachment translation page with the publish.
      await enqueueAttachmentPage(tx, file.id);
      return published;
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
    include: { uploader: true, attachmentPage: true },
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

// A can_review coordinator re-runs the scan on a check_failed file. A clean
// result publishes, unless the file name is an explicit retainer-fee inquiry.
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
