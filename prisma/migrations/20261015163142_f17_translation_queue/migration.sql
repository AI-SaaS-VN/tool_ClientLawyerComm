-- AlterTable
ALTER TABLE "translation_versions" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "next_retry_at" TIMESTAMP(3);
