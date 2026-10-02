-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "orig_hash" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_variants" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "source_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_case_id_status_idx" ON "files"("case_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "file_variants_file_id_kind_version_key" ON "file_variants"("file_id", "kind", "version");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_variants" ADD CONSTRAINT "file_variants_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added CHECKs (SPEC 8.1 file state machine; variant kinds per REQ-FILE-04)
ALTER TABLE "files" ADD CONSTRAINT "files_status_check" CHECK ("status" IN ('uploaded','scanning','pending_review','approved','published','returned','rejected','check_failed'));
ALTER TABLE "file_variants" ADD CONSTRAINT "file_variants_kind_check" CHECK ("kind" IN ('original','shared_copy'));
