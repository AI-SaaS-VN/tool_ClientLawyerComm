-- A file sent with a message records that message. A later message may
-- point at a file already on the case. Both links are optional.

ALTER TABLE "files" ADD COLUMN "message_id" UUID;

-- Multiple files with no message stay allowed; one message has at most one file.
CREATE UNIQUE INDEX "files_message_id_key" ON "files"("message_id");

ALTER TABLE "files" ADD CONSTRAINT "files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages" ADD COLUMN "cited_file_id" UUID;

CREATE INDEX "messages_cited_file_id_idx" ON "messages"("cited_file_id");

ALTER TABLE "messages" ADD CONSTRAINT "messages_cited_file_id_fkey" FOREIGN KEY ("cited_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
