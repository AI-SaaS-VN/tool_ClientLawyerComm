-- CreateTable
CREATE TABLE "attachment_pages" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source_lang" TEXT,
    "source_text" TEXT,
    "target_lang" TEXT,
    "translated_text" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachment_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attachment_pages_file_id_key" ON "attachment_pages"("file_id");

-- AddForeignKey
ALTER TABLE "attachment_pages" ADD CONSTRAINT "attachment_pages_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added: constrain the page state machine (SPEC REQ-ATT-04).
ALTER TABLE "attachment_pages"
    ADD CONSTRAINT "attachment_pages_status_check"
    CHECK ("status" IN ('pending', 'processing', 'ready', 'no_text', 'failed'));
