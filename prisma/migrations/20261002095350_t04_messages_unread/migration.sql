-- AlterTable
ALTER TABLE "case_members" ADD COLUMN     "last_read_message_id" UUID;

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "source_lang" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_check',
    "seq" SERIAL NOT NULL,
    "published_at" TIMESTAMP(3),
    "corrected_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messages_seq_key" ON "messages"("seq");

-- CreateIndex
CREATE INDEX "messages_case_id_status_published_at_idx" ON "messages"("case_id", "status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_case_id_author_id_idempotency_key_key" ON "messages"("case_id", "author_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_corrected_by_id_fkey" FOREIGN KEY ("corrected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Message state machine (SPEC 5.1): the full enum is created now even though
-- the T04 pass-through stub only exercises pending_check/checking/published.
ALTER TABLE "messages" ADD CONSTRAINT "messages_status_check"
    CHECK ("status" IN ('pending_check', 'checking', 'pending_review', 'approved', 'published', 'returned', 'rejected', 'check_failed'));
