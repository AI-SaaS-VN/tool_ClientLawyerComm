-- CreateTable
CREATE TABLE "docx_jobs" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "source_lang" TEXT,
    "target_lang" TEXT,
    "paragraph_count" INTEGER,
    "page_estimate" INTEGER,
    "progress" JSONB,
    "output_file_id" UUID,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docx_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "docx_jobs_case_id_idx" ON "docx_jobs"("case_id");

-- CreateIndex
CREATE INDEX "docx_jobs_file_id_idx" ON "docx_jobs"("file_id");

-- AddForeignKey
ALTER TABLE "docx_jobs" ADD CONSTRAINT "docx_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docx_jobs" ADD CONSTRAINT "docx_jobs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added: constrain the conversion state machine (SPEC REQ-DOC).
ALTER TABLE "docx_jobs"
    ADD CONSTRAINT "docx_jobs_status_check"
    CHECK ("status" IN ('queued', 'processing', 'done', 'rejected_unsupported', 'rejected_too_long', 'rejected_lang', 'failed'));
