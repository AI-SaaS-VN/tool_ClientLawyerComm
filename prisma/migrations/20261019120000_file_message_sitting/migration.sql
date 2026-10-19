-- A new send still attaches at most one file (enforced in the upload
-- service). Files already on a case may share one message when the same
-- person uploaded them within an hour of that message.

DROP INDEX "files_message_id_key";

CREATE INDEX "files_message_id_idx" ON "files"("message_id");

UPDATE "files" AS f
SET "message_id" = picked.message_id
FROM (
  SELECT DISTINCT ON (f2.id)
    f2.id AS file_id,
    m.id AS message_id
  FROM "files" AS f2
  JOIN "messages" AS m
    ON m.case_id = f2.case_id
   AND m.author_id = f2.uploader_id
   AND m.created_at BETWEEN f2.created_at - INTERVAL '60 minutes'
                        AND f2.created_at + INTERVAL '60 minutes'
  WHERE f2.message_id IS NULL
  ORDER BY f2.id, abs(EXTRACT(EPOCH FROM (m.created_at - f2.created_at)))
) AS picked
WHERE f.id = picked.file_id
  AND f.message_id IS NULL;
