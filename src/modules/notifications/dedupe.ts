// Pure notification-queue rules (no I/O): retry schedule, dedupe keys,
// recipient selection, and batch grouping. DB access lives in
// src/server/jobs/{queue,worker}.ts.

export const MAX_NOTIFICATION_ATTEMPTS = 5;

// REQ-NTF-05/11: retry 1/5/15 minutes after failed attempts, at most 5
// attempts; null means the budget is exhausted and the task fails finally.
const BACKOFF_MINUTES = [1, 5, 15, 15];

export function backoffDelayMs(failedAttempts: number): number | null {
  const minutes = BACKOFF_MINUTES[failedAttempts - 1];
  return minutes === undefined ? null : minutes * 60_000;
}

// REQ-NTF-05 cooldown: repeated urgent clicks for the same case and recipient
// inside the window keep only one valid (non-terminal) task; the per-sequence
// dedupe key below guarantees uniqueness once a new task must be created.
export const URGENT_COOLDOWN_MS = 10 * 60_000;

// Task states that still count as a live alert for cooldown purposes.
export const URGENT_OPEN_STATUSES = ["queued", "submitted", "unknown"] as const;

export function peerUrgentDedupeKey(
  caseId: string,
  recipientUserId: string,
  seq: number,
): string {
  return `peer_urgent:${caseId}:${recipientUserId}:${seq}`;
}

export function isUrgentInCooldown(createdAt: Date, now: Date): boolean {
  const elapsed = now.getTime() - createdAt.getTime();
  return elapsed >= 0 && elapsed < URGENT_COOLDOWN_MS;
}

// One alert record per review task, recipient, and escalation level
// (REQ-NTF-10); re-registration with the same key is a no-op.
export function reviewAlertDedupeKey(
  reviewTaskId: string,
  recipientUserId: string,
  level: number,
): string {
  return `review_alert:${reviewTaskId}:${recipientUserId}:l${level}`;
}

// REQ-NTF-07 recipient rules: at registration time only the case's
// coordinators with can_review are alerted; configured backup coordinators
// are the REQ-NTF-11 escalation target and are notified immediately ONLY
// when no reviewer remains (author skipped, or no reviewers at all). A sole
// reviewer without a backup is still notified (selfReview drives the
// REQ-REV-06 prompt).
export function selectReviewAlertRecipients(input: {
  reviewers: string[];
  backups: string[];
  authorId: string;
}): { recipientIds: string[]; selfReview: boolean } {
  const reviewerOthers = [...new Set(input.reviewers)].filter((id) => id !== input.authorId);
  if (reviewerOthers.length > 0) return { recipientIds: reviewerOthers, selfReview: false };
  const backupOthers = [...new Set(input.backups)].filter((id) => id !== input.authorId);
  if (input.reviewers.includes(input.authorId)) {
    if (backupOthers.length > 0) return { recipientIds: backupOthers, selfReview: false };
    return { recipientIds: [input.authorId], selfReview: true };
  }
  return { recipientIds: backupOthers, selfReview: false };
}

// REQ-NTF-10: consecutive pending items may merge into one email per
// (case, recipient); the worker sends one message per batch and marks every
// alert in it, so the first item triggers immediately and none are lost.
export function groupAlertsIntoBatches<T extends { caseId: string; recipientUserId: string }>(
  alerts: T[],
): Map<string, T[]> {
  const batches = new Map<string, T[]>();
  for (const alert of alerts) {
    const key = `${alert.caseId}:${alert.recipientUserId}`;
    const batch = batches.get(key);
    if (batch) batch.push(alert);
    else batches.set(key, [alert]);
  }
  return batches;
}
