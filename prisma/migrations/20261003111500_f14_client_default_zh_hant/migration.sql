-- Accounts created under the earlier client default stored zh-Hans without
-- the person choosing it. Move those rows to the current client default.
UPDATE "users"
SET "preferred_lang" = 'zh-Hant', "ui_lang" = 'zh-Hant'
WHERE "global_role" = 'client'
  AND "preferred_lang" = 'zh-Hans'
  AND "ui_lang" = 'zh-Hans';
