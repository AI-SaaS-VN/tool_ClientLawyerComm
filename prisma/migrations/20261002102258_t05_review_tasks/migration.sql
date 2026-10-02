-- CreateTable
CREATE TABLE "review_tasks" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "assignee_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reason" TEXT NOT NULL,
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_tasks_case_id_status_idx" ON "review_tasks"("case_id", "status");

-- CreateIndex
CREATE INDEX "review_tasks_target_type_target_id_idx" ON "review_tasks"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Review task shape (SPEC 13): 'file' targets arrive with T08; decision
-- statuses are written by the T07 review console, registration only uses 'open'.
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_target_type_check"
    CHECK ("target_type" IN ('message', 'file'));
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_status_check"
    CHECK ("status" IN ('open', 'approved', 'returned', 'rejected', 'cancelled'));
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_reason_check"
    CHECK (char_length("reason") BETWEEN 1 AND 200);
