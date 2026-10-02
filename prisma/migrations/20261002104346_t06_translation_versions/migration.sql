-- CreateTable
CREATE TABLE "translation_versions" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "target_lang" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT,
    "model" TEXT,
    "prompt_version" TEXT,
    "key_field_check" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translation_versions_message_id_target_lang_idx" ON "translation_versions"("message_id", "target_lang");

-- CreateIndex
CREATE UNIQUE INDEX "translation_versions_message_id_target_lang_version_key" ON "translation_versions"("message_id", "target_lang", "version");

-- SPEC 5.2 state machine + REQ-TR-01 language scope
ALTER TABLE "translation_versions" ADD CONSTRAINT "translation_versions_status_check"
    CHECK ("status" IN ('queued', 'translating', 'done', 'failed', 'needs_review'));
ALTER TABLE "translation_versions" ADD CONSTRAINT "translation_versions_target_lang_check"
    CHECK ("target_lang" IN ('zh-Hans', 'zh-Hant', 'vi', 'en'));

-- AddForeignKey
ALTER TABLE "translation_versions" ADD CONSTRAINT "translation_versions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
