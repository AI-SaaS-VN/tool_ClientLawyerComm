import { describe, expect, it } from "vitest";

import {
  MAX_NOTIFICATION_ATTEMPTS,
  URGENT_COOLDOWN_MS,
  backoffDelayMs,
  groupAlertsIntoBatches,
  isUrgentInCooldown,
  peerUrgentDedupeKey,
  reviewAlertDedupeKey,
  selectReviewAlertRecipients,
} from "@/modules/notifications/dedupe";

describe("backoffDelayMs (REQ-NTF-05/11: 1/5/15-minute backoff, at most 5 attempts)", () => {
  it("schedules retries at 1, 5, 15, 15 minutes after attempts 1-4", () => {
    expect(backoffDelayMs(1)).toBe(60_000);
    expect(backoffDelayMs(2)).toBe(5 * 60_000);
    expect(backoffDelayMs(3)).toBe(15 * 60_000);
    expect(backoffDelayMs(4)).toBe(15 * 60_000);
  });

  it("returns null once the attempt budget is exhausted (final failure)", () => {
    expect(MAX_NOTIFICATION_ATTEMPTS).toBe(5);
    expect(backoffDelayMs(5)).toBeNull();
    expect(backoffDelayMs(6)).toBeNull();
  });
});

describe("reviewAlertDedupeKey (REQ-NTF-10)", () => {
  it("is stable per review task, recipient, and escalation level", () => {
    expect(reviewAlertDedupeKey("task-1", "user-1", 0)).toBe("review_alert:task-1:user-1:l0");
    expect(reviewAlertDedupeKey("task-1", "user-1", 0)).toBe(
      reviewAlertDedupeKey("task-1", "user-1", 0),
    );
    expect(reviewAlertDedupeKey("task-1", "user-1", 1)).not.toBe(
      reviewAlertDedupeKey("task-1", "user-1", 0),
    );
    expect(reviewAlertDedupeKey("task-1", "user-2", 0)).not.toBe(
      reviewAlertDedupeKey("task-1", "user-1", 0),
    );
  });
});

describe("selectReviewAlertRecipients (REQ-NTF-07)", () => {
  it("notifies every reviewer when the author is not a reviewer", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: ["r1", "r2"], backups: [], authorId: "lawyer" }),
    ).toEqual({ recipientIds: ["r1", "r2"], selfReview: false });
  });

  it("skips the author when another reviewer exists", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: ["r1", "r2"], backups: [], authorId: "r1" }),
    ).toEqual({ recipientIds: ["r2"], selfReview: false });
  });

  it("skips the author and notifies the backup when only a backup remains", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: ["r1"], backups: ["b1"], authorId: "r1" }),
    ).toEqual({ recipientIds: ["b1"], selfReview: false });
  });

  it("notifies the author as the sole reviewer without a backup (REQ-REV-06 prompt)", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: ["r1"], backups: [], authorId: "r1" }),
    ).toEqual({ recipientIds: ["r1"], selfReview: true });
  });

  it("does not alert the backup at registration while other reviewers remain (escalation path)", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: ["r1", "r2"], backups: ["r2", "b1"], authorId: "x" }),
    ).toEqual({ recipientIds: ["r1", "r2"], selfReview: false });
  });

  it("returns nobody when no reviewer and no backup exists (anomaly path)", () => {
    expect(
      selectReviewAlertRecipients({ reviewers: [], backups: [], authorId: "lawyer" }),
    ).toEqual({ recipientIds: [], selfReview: false });
  });
});

describe("groupAlertsIntoBatches (REQ-NTF-10: merged batches)", () => {
  it("groups alerts by case and recipient, keeping first-seen order", () => {
    const alerts = [
      { id: "a1", caseId: "c1", recipientUserId: "u1" },
      { id: "a2", caseId: "c1", recipientUserId: "u1" },
      { id: "a3", caseId: "c1", recipientUserId: "u2" },
      { id: "a4", caseId: "c2", recipientUserId: "u1" },
    ];
    const batches = groupAlertsIntoBatches(alerts);
    expect([...batches.values()].map((batch) => batch.map((a) => a.id))).toEqual([
      ["a1", "a2"],
      ["a3"],
      ["a4"],
    ]);
  });
});

describe("peer urgent cooldown (REQ-NTF-05: 10-minute window)", () => {
  it("produces per-sequence dedupe keys per case and recipient", () => {
    expect(peerUrgentDedupeKey("c1", "u1", 1)).toBe("peer_urgent:c1:u1:1");
    expect(peerUrgentDedupeKey("c1", "u1", 2)).not.toBe(peerUrgentDedupeKey("c1", "u1", 1));
    expect(peerUrgentDedupeKey("c1", "u2", 1)).not.toBe(peerUrgentDedupeKey("c1", "u1", 1));
    expect(peerUrgentDedupeKey("c2", "u1", 1)).not.toBe(peerUrgentDedupeKey("c1", "u1", 1));
  });

  it("keeps clicks inside the window on the existing task and releases them after it", () => {
    const created = new Date("2026-10-02T12:00:00Z");
    expect(URGENT_COOLDOWN_MS).toBe(10 * 60_000);
    expect(isUrgentInCooldown(created, new Date(created.getTime() + 9 * 60_000))).toBe(true);
    expect(isUrgentInCooldown(created, new Date(created.getTime() + 10 * 60_000))).toBe(false);
    expect(isUrgentInCooldown(created, new Date(created.getTime() - 1))).toBe(false);
  });
});
