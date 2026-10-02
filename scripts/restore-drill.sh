#!/usr/bin/env bash
# REQ-OPS-04: restore drill. Restores an encrypted backup into an isolated
# scratch database, runs referential-integrity checks, prints a report with
# timings, and cleans everything up.
#
# Usage: BACKUP_ENCRYPTION_KEY=... bash scripts/restore-drill.sh [backup-file]
#   DB_CONTAINER   postgres container (default clc-postgres)
#   SOURCE_DB      database the backup came from (default clc_dev)
#   RESTORE_DB     scratch database name (default clc_restore_check)
#   BACKUP_DIR     where backups live (default ./backups)
# RPO <=24h / RTO <=8h are targets this drill MEASURES (backup age, restore
# duration) — the report records the measured values; it does not assert
# that the targets were met.
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-clc-postgres}"
SOURCE_DB="${SOURCE_DB:-clc_dev}"
RESTORE_DB="${RESTORE_DB:-clc_restore_check}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
: "${BACKUP_ENCRYPTION_KEY:?set BACKUP_ENCRYPTION_KEY in the environment (never commit it)}"

backup_file="${1:-$(ls -1t "$BACKUP_DIR"/"${SOURCE_DB}"-*.dump.enc 2>/dev/null | head -1 || true)}"
if [ -z "${backup_file:-}" ] || [ ! -f "$backup_file" ]; then
  echo "drill: no backup file found in $BACKUP_DIR" >&2
  exit 1
fi

psql() { docker exec -i "$DB_CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -At "$@"; }

tmp="$(mktemp)"
cleanup() {
  rm -f "$tmp"
  docker exec "$DB_CONTAINER" psql -U postgres \
    -c "DROP DATABASE IF EXISTS $RESTORE_DB WITH (FORCE)" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "drill: backup file: $backup_file"
backup_epoch="$(date -u -r "$backup_file" +%s)"
start="$(date +%s)"

openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in "$backup_file" -out "$tmp"
docker exec "$DB_CONTAINER" psql -U postgres \
  -c "DROP DATABASE IF EXISTS $RESTORE_DB WITH (FORCE)" >/dev/null
docker exec "$DB_CONTAINER" createdb -U postgres "$RESTORE_DB" >/dev/null
docker exec -i "$DB_CONTAINER" pg_restore -U postgres -d "$RESTORE_DB" --no-owner --no-privileges \
  <"$tmp" >/dev/null
restored="$(date +%s)"

counts_sql="SELECT 'users', count(*) FROM users
UNION ALL SELECT 'cases', count(*) FROM cases
UNION ALL SELECT 'case_members', count(*) FROM case_members
UNION ALL SELECT 'invites', count(*) FROM invites
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'review_tasks', count(*) FROM review_tasks
UNION ALL SELECT 'notification_tasks', count(*) FROM notification_tasks
UNION ALL SELECT 'files', count(*) FROM files
UNION ALL SELECT 'file_variants', count(*) FROM file_variants
UNION ALL SELECT 'translation_versions', count(*) FROM translation_versions
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
ORDER BY 1;"

orphans_sql="SELECT 'members_without_case', count(*) FROM case_members m LEFT JOIN cases c ON c.id = m.case_id WHERE c.id IS NULL
UNION ALL SELECT 'members_without_user', count(*) FROM case_members m LEFT JOIN users u ON u.id = m.user_id WHERE u.id IS NULL
UNION ALL SELECT 'messages_without_case', count(*) FROM messages m LEFT JOIN cases c ON c.id = m.case_id WHERE c.id IS NULL
UNION ALL SELECT 'messages_without_author', count(*) FROM messages m LEFT JOIN users u ON u.id = m.author_id WHERE u.id IS NULL
UNION ALL SELECT 'published_without_timestamp', count(*) FROM messages WHERE status = 'published' AND published_at IS NULL
UNION ALL SELECT 'invites_without_case', count(*) FROM invites i LEFT JOIN cases c ON c.id = i.case_id WHERE c.id IS NULL
UNION ALL SELECT 'files_without_case', count(*) FROM files f LEFT JOIN cases c ON c.id = f.case_id WHERE c.id IS NULL
UNION ALL SELECT 'variants_without_file', count(*) FROM file_variants v LEFT JOIN files f ON f.id = v.file_id WHERE f.id IS NULL
UNION ALL SELECT 'notifications_without_case', count(*) FROM notification_tasks n LEFT JOIN cases c ON c.id = n.case_id WHERE c.id IS NULL
UNION ALL SELECT 'reviews_without_case', count(*) FROM review_tasks r LEFT JOIN cases c ON c.id = r.case_id WHERE c.id IS NULL
UNION ALL SELECT 'translations_without_message', count(*) FROM translation_versions t LEFT JOIN messages m ON m.id = t.message_id WHERE m.id IS NULL
ORDER BY 1;"

echo "drill: row counts (restored vs source)"
paste <(echo "$counts_sql" | psql -d "$RESTORE_DB") <(echo "$counts_sql" | psql -d "$SOURCE_DB") \
  | awk -F'[|\t]' '{printf "  %-24s restored=%-8s source=%s\n", $1, $2, $4}'

echo "drill: referential-integrity checks (every count must be 0)"
orphans="$(echo "$orphans_sql" | psql -d "$RESTORE_DB")"
echo "$orphans" | awk -F'|' '{printf "  %-28s %s\n", $1, $2}'
bad="$(echo "$orphans" | awk -F'|' '$2 != 0' | wc -l)"

checked="$(date +%s)"
now="$(date +%s)"
backup_age_h=$(( (now - backup_epoch) / 3600 ))
restore_s=$((restored - start))
total_s=$((checked - start))

echo "drill: ---- report ----"
echo "drill: backup age at drill time: ${backup_age_h}h (RPO target <=24h, measured not asserted)"
echo "drill: decrypt+restore duration: ${restore_s}s; incl. checks: ${total_s}s (RTO target <=8h, measured not asserted)"
if [ "$bad" -eq 0 ]; then
  echo "drill: RESULT: PASS — all referential-integrity checks are zero"
else
  echo "drill: RESULT: FAIL — $bad integrity check(s) non-zero" >&2
  exit 1
fi
