-- CreateTable
CREATE TABLE "case_registry_lookups" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'none',
    "query_name" TEXT,
    "tax_code" TEXT,
    "name_vi" TEXT,
    "name_en" TEXT,
    "status_text" TEXT,
    "address" TEXT,
    "legal_rep" TEXT,
    "main_industry" TEXT,
    "source_url" TEXT,
    "candidates" JSONB,
    "result_text" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "looked_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_registry_lookups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_registry_lookups_case_id_key" ON "case_registry_lookups"("case_id");

-- AddForeignKey
ALTER TABLE "case_registry_lookups" ADD CONSTRAINT "case_registry_lookups_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added: constrain the lookup state machine (SPEC REQ-REG).
ALTER TABLE "case_registry_lookups"
    ADD CONSTRAINT "case_registry_lookups_status_check"
    CHECK ("status" IN ('none', 'queued', 'processing', 'ready', 'no_match', 'failed'));
