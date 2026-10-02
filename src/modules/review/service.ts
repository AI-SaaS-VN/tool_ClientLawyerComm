import type { ReviewTask, User } from "@prisma/client";

import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { copySharedVersion } from "@/modules/files/service";
import { toMessageView } from "@/modules/messages/service";
import { requireCaseMember } from "@/server/guards/case-guards";
import {
  cancelQueuedAlertsForReviewTask,
  listAlertIssueReviewTaskIds,
} from "@/server/jobs/queue";
import { publishToCase } from "@/server/sse/hub";

export type ReviewAction = "approve" | "return" | "reject";

export interface ReviewTaskView {
  id: string;
  caseId: string;
  caseTitle: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  escalationLevel: number;
  submitterDisplayName: string;
  sourceText: string | null;
  selfReleaseRequired: boolean;
  alertIssue: boolean;
  createdAt: Date;
}

// Reviewer-capable memberships: active coordinators holding can_review, plus
// configured backup coordinators (they decide tasks escalated to them).
async function reviewerMemberships(userId: string) {
  return prisma.caseMember.findMany({
    where: {
      userId,
      status: "active",
      memberRole: "coordinator",
      OR: [{ canReview: true }, { isBackup: true }],
    },
  });
}

// REQ-REV-06: does anyone besides this author hold review duties (can_review
// or configured backup) on the case?
async function hasOtherReviewer(caseId: string, authorId: string): Promise<boolean> {
  const other = await prisma.caseMember.findFirst({
    where: {
      caseId,
      status: "active",
      memberRole: "coordinator",
      userId: { not: authorId },
      OR: [{ canReview: true }, { isBackup: true }],
    },
  });
  return other !== null;
}

async function loadTargetAuthor(task: ReviewTask): Promise<{ authorId: string; displayName: string; sourceText: string | null }> {
  if (task.targetType === "message") {
    const message = await prisma.message.findUnique({
      where: { id: task.targetId },
      include: { author: true },
    });
    if (!message) throw new ApiError(404, "not_found");
    return {
      authorId: message.authorId,
      displayName: message.author.displayName,
      sourceText: message.sourceText,
    };
  }
  if (task.targetType === "file") {
    const file = await prisma.file.findUnique({
      where: { id: task.targetId },
      include: { uploader: true },
    });
    if (!file) throw new ApiError(404, "not_found");
    // REQ-REV-05 minimum: the reviewer sees the file name under review; the
    // content itself is pulled through the authorized download path.
    return {
      authorId: file.uploaderId,
      displayName: file.uploader.displayName,
      sourceText: file.originalName,
    };
  }
  throw new ApiError(400, "unsupported_target");
}

// REQ-REV-01: a coordinator sees only the pending queue of their assigned
// cases — type, case, submitter display name, entry time. REQ-REV-05: only
// the source under review is exposed; REQ-REV-06: an author never sees their
// own task when another reviewer or a backup exists.
export async function listReviewTasks(user: User): Promise<ReviewTaskView[]> {
  const memberships = await reviewerMemberships(user.id);
  if (memberships.length === 0) throw new ApiError(403, "forbidden");
  const caseIds = memberships.map((m) => m.caseId);

  const tasks = await prisma.reviewTask.findMany({
    where: { caseId: { in: caseIds }, status: "open" },
    include: { case: true },
    orderBy: { createdAt: "asc" },
  });
  const issueIds = await listAlertIssueReviewTaskIds(tasks.map((t) => t.id));

  const views: ReviewTaskView[] = [];
  for (const task of tasks) {
    const target = await loadTargetAuthor(task);
    if (target.authorId === user.id && (await hasOtherReviewer(task.caseId, user.id))) {
      continue;
    }
    views.push({
      id: task.id,
      caseId: task.caseId,
      caseTitle: task.case.title,
      targetType: task.targetType,
      targetId: task.targetId,
      reason: task.reason,
      status: task.status,
      escalationLevel: task.escalationLevel,
      submitterDisplayName: target.displayName,
      sourceText: target.sourceText,
      selfReleaseRequired: target.authorId === user.id,
      alertIssue: issueIds.has(task.id),
      createdAt: task.createdAt,
    });
  }

  // REQ-NTF-09 (lightweight): first queue view marks the task opened; the
  // decision path records started/decided separately.
  const now = new Date();
  await prisma.reviewTask.updateMany({
    where: { id: { in: views.map((v) => v.id) }, openedAt: null },
    data: { openedAt: now },
  });
  return views;
}

// REQ-REV-02/03: approve continues the pipeline to publish; return/reject
// stay invisible to the other party. Operator, time, and reason are recorded
// on the task (audit trail rows are T11).
export async function decideReviewTask(
  taskId: string,
  user: User,
  action: ReviewAction,
  input: { reason?: unknown; selfRelease?: unknown },
): Promise<{ status: string }> {
  const task = await prisma.reviewTask.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "not_found");
  const member = await requireCaseMember(task.caseId, user);
  if (member.memberRole !== "coordinator" || (!member.canReview && !member.isBackup)) {
    throw new ApiError(403, "forbidden");
  }
  if (task.status !== "open") throw new ApiError(409, "review_already_decided");

  const reason = readReason(action, input.reason);
  const selfRelease = input.selfRelease === true;
  const target = await loadTargetAuthor(task);

  let selfReleased = false;
  if (target.authorId === user.id) {
    if (await hasOtherReviewer(task.caseId, user.id)) {
      // REQ-REV-06: with another reviewer or a backup, the author never
      // decides their own task.
      throw new ApiError(403, "self_review_forbidden");
    }
    // Sole reviewer without a backup: only an explicit self-release confirm
    // publishes; dismissal and timeout never do.
    if (action !== "approve" || !selfRelease) {
      throw new ApiError(400, "self_release_required");
    }
    selfReleased = true;
  }

  const now = new Date();
  const taskStatus = action === "approve" ? "approved" : action === "return" ? "returned" : "rejected";
  const messageStatus = action === "approve" ? "published" : taskStatus;

  // REQ-FILE-04/05: approving a file stores the shared copy separately from
  // the immutable original BEFORE the decision transaction, so a storage
  // failure leaves the task open and the file unpublished.
  let sharedCopy: { storageKey: string; version: number } | null = null;
  if (task.targetType === "file" && action === "approve") {
    const file = await prisma.file.findUnique({ where: { id: task.targetId } });
    if (!file) throw new ApiError(404, "not_found");
    sharedCopy = await copySharedVersion(file);
  }

  const published = await prisma.$transaction(async (tx) => {
    await tx.reviewTask.update({
      where: { id: task.id },
      data: {
        status: taskStatus,
        startedAt: task.startedAt ?? now,
        decidedAt: now,
        decidedById: user.id,
        decisionReason: reason,
        selfRelease: selfReleased,
      },
    });
    const message =
      task.targetType === "message"
        ? await tx.message.update({
            where: { id: task.targetId },
            data: {
              status: messageStatus,
              publishedAt: action === "approve" ? now : null,
            },
            include: { author: true },
          })
        : null;
    if (task.targetType === "file") {
      await tx.file.update({
        where: { id: task.targetId },
        data: {
          status: messageStatus,
          publishedAt: action === "approve" ? now : null,
        },
      });
      if (sharedCopy) {
        await tx.fileVariant.create({
          data: {
            fileId: task.targetId,
            kind: "shared_copy",
            version: sharedCopy.version,
            storageKey: sharedCopy.storageKey,
            sourceVersion: 1,
          },
        });
      }
    }
    await cancelQueuedAlertsForReviewTask(tx, task.id, now);
    return message;
  });
  // TODO(T11): audit (review decision; self_release when applicable)

  if (action === "approve" && published) {
    publishToCase(published.caseId, "message", JSON.stringify({ message: toMessageView(published) }));
  }
  return { status: taskStatus };
}

function readReason(action: ReviewAction, value: unknown): string | null {
  if (value === undefined || value === null) {
    if (action === "approve") return null;
    throw new ApiError(400, "reason_required");
  }
  if (typeof value !== "string" || value.trim().length === 0 || [...value].length > 200) {
    throw new ApiError(400, "invalid_reason");
  }
  return value;
}

// REQ-REV-04: an appeal is a note on the original task by the author; it
// never publishes the content.
export async function appealReviewTask(
  taskId: string,
  user: User,
  input: { note?: unknown },
): Promise<void> {
  const task = await prisma.reviewTask.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiError(404, "not_found");
  const note = input.note;
  if (typeof note !== "string" || note.trim().length === 0 || [...note].length > 1000) {
    throw new ApiError(400, "invalid_note");
  }
  const target = await loadTargetAuthor(task);
  if (target.authorId !== user.id) throw new ApiError(403, "forbidden");
  await prisma.reviewTask.update({
    where: { id: task.id },
    data: { appealNote: note, appealedAt: new Date() },
  });
  // TODO(T11): audit (appeal)
}
