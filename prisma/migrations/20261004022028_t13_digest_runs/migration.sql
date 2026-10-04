-- CreateTable
CREATE TABLE "digest_runs" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "digest_date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "recipients_json" JSONB NOT NULL,
    "parts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "body_text" TEXT,
    "parts_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digest_runs_case_id_digest_date_key" ON "digest_runs"("case_id", "digest_date");

-- AddForeignKey
ALTER TABLE "digest_runs" ADD CONSTRAINT "digest_runs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- T13: 'case_digest' is the Coordinator daily email kind (REQ-DIG-05).
ALTER TABLE "notification_tasks" DROP CONSTRAINT "notification_tasks_kind_check";
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_kind_check"
    CHECK ("kind" IN ('review_alert', 'peer_urgent', 'check_failed_alert', 'urgent_failed_alert', 'case_digest'));

-- digest_runs lifecycle: queued at generation, sent/partial/failed once no
-- queued part task remains, skipped for empty days, archived cases, or cases
-- without a verified coordinator email (REQ-DIG-03/05).
ALTER TABLE "digest_runs" ADD CONSTRAINT "digest_runs_status_check"
    CHECK ("status" IN ('queued', 'sent', 'skipped', 'failed', 'partial'));
ALTER TABLE "digest_runs" ADD CONSTRAINT "digest_runs_digest_date_check"
    CHECK ("digest_date" ~ '^\d{4}-\d{2}-\d{2}$');
