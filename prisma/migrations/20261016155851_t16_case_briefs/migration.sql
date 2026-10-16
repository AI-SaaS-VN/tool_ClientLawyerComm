-- CreateTable
CREATE TABLE "case_briefs" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "questions_status" TEXT NOT NULL DEFAULT 'none',
    "questions" JSONB,
    "questions_at" TIMESTAMP(3),
    "last_content_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "brief_text" TEXT,
    "confirmed_by_id" UUID,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_briefs_case_id_key" ON "case_briefs"("case_id");

-- AddForeignKey
ALTER TABLE "case_briefs" ADD CONSTRAINT "case_briefs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added: constrain the question-generation state machine (SPEC REQ-BRIEF).
ALTER TABLE "case_briefs"
    ADD CONSTRAINT "case_briefs_questions_status_check"
    CHECK ("questions_status" IN ('none', 'queued', 'processing', 'ready', 'failed'));
