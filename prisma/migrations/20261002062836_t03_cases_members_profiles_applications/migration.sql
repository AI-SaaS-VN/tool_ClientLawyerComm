/*
  Warnings:

  - Added the required column `client_org_name` to the `cases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "case_members" ADD COLUMN     "digest_opt_out" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "alias" TEXT,
ADD COLUMN     "client_org_name" TEXT NOT NULL,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "ref_no" TEXT;

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_applications" (
    "id" UUID NOT NULL,
    "lawyer_id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decided_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_profiles_lawyer_id_idx" ON "client_profiles"("lawyer_id");

-- CreateIndex
CREATE INDEX "case_applications_lawyer_id_idx" ON "case_applications"("lawyer_id");

-- CreateIndex
CREATE INDEX "case_applications_status_idx" ON "case_applications"("status");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_applications" ADD CONSTRAINT "case_applications_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_applications" ADD CONSTRAINT "case_applications_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_applications" ADD CONSTRAINT "case_applications_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECK constraints (REQ-CASE-01: title 1-80 chars, no line breaks; status enums).
ALTER TABLE "cases" ADD CONSTRAINT "cases_title_check"
    CHECK (char_length("title") BETWEEN 1 AND 80 AND "title" !~ '[\r\n]');
ALTER TABLE "cases" ADD CONSTRAINT "cases_status_check"
    CHECK ("status" IN ('active', 'archived'));
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_status_check"
    CHECK ("status" IN ('active', 'revoked'));
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_role_check"
    CHECK ("member_role" IN ('client', 'lawyer', 'coordinator'));
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_status_check"
    CHECK ("status" IN ('active', 'archived'));
ALTER TABLE "case_applications" ADD CONSTRAINT "case_applications_status_check"
    CHECK ("status" IN ('pending', 'approved', 'rejected'));
