-- AlterTable
ALTER TABLE "case_briefs" ADD COLUMN     "statute_links" JSONB,
ADD COLUMN     "statute_note" TEXT,
ADD COLUMN     "statute_status" TEXT NOT NULL DEFAULT 'none';

-- Hand-added: constrain the statute-suggestion state machine (SPEC REQ-STAT).
ALTER TABLE "case_briefs"
    ADD CONSTRAINT "case_briefs_statute_status_check"
    CHECK ("statute_status" IN ('none', 'queued', 'processing', 'ready', 'failed'));
