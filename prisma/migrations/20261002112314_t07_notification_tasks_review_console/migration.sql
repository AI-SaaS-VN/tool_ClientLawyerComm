-- AlterTable
ALTER TABLE "case_members" ADD COLUMN     "is_backup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "review_tasks" ADD COLUMN     "appeal_note" TEXT,
ADD COLUMN     "appealed_at" TIMESTAMP(3),
ADD COLUMN     "decided_by_id" UUID,
ADD COLUMN     "decision_reason" TEXT,
ADD COLUMN     "opened_at" TIMESTAMP(3),
ADD COLUMN     "self_release" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "started_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notification_tasks" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "case_id" UUID NOT NULL,
    "review_task_id" UUID,
    "recipient_user_id" UUID NOT NULL,
    "recipient_channel_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "dedupe_key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "provider_ref" TEXT,
    "last_error" TEXT,
    "submitted_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_tasks_dedupe_key_key" ON "notification_tasks"("dedupe_key");

-- CreateIndex
CREATE INDEX "notification_tasks_status_next_retry_at_idx" ON "notification_tasks"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "notification_tasks_case_id_kind_idx" ON "notification_tasks"("case_id", "kind");

-- CreateIndex
CREATE INDEX "notification_tasks_review_task_id_idx" ON "notification_tasks"("review_task_id");

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_review_task_id_fkey" FOREIGN KEY ("review_task_id") REFERENCES "review_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_recipient_channel_id_fkey" FOREIGN KEY ("recipient_channel_id") REFERENCES "contact_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification task shape (SPEC 10.1). 'peer_urgent' and 'check_failed_alert'
-- are registered by T08/T10; the MVP sender only processes 'review_alert'.
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_kind_check"
    CHECK ("kind" IN ('review_alert', 'peer_urgent', 'check_failed_alert'));
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_status_check"
    CHECK ("status" IN ('queued', 'submitted', 'delivered', 'unknown', 'failed', 'cancelled', 'in_app_confirmed'));

-- Backup coordinators are coordinator memberships only (REQ-NTF-11).
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_is_backup_check"
    CHECK ("is_backup" = false OR "member_role" = 'coordinator');

-- Decision/appeal notes mirror the review_tasks reason length policy.
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_decision_reason_check"
    CHECK ("decision_reason" IS NULL OR char_length("decision_reason") BETWEEN 1 AND 200);
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_appeal_note_check"
    CHECK ("appeal_note" IS NULL OR char_length("appeal_note") BETWEEN 1 AND 1000);
