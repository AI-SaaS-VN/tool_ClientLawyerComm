#!/usr/bin/env bash
# REQ-OPS-04: encrypted dump of the application database.
#
# Usage: BACKUP_ENCRYPTION_KEY=... bash scripts/backup.sh [database-name]
#   DB_CONTAINER   postgres container (default clc-postgres)
#   BACKUP_DIR     output directory, git-ignored (default ./backups)
#   DB_NAME        database to dump (positional arg wins; default clc_dev)
# The encryption key arrives via the environment only — it is never written
# into the repository or the backup itself (openssl derives via PBKDF2).
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-clc-postgres}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_NAME="${1:-${DB_NAME:-clc_dev}}"
: "${BACKUP_ENCRYPTION_KEY:?set BACKUP_ENCRYPTION_KEY in the environment (never commit it)}"

mkdir -p "$BACKUP_DIR"
ts="$(date -u +%Y%m%d-%H%M%S)"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

start=$(date +%s)
docker exec "$DB_CONTAINER" pg_dump -U postgres -d "$DB_NAME" -Fc >"$tmp"
out="$BACKUP_DIR/${DB_NAME}-${ts}.dump.enc"
openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_KEY -in "$tmp" -out "$out"
end=$(date +%s)

echo "backup: $out"
echo "backup: database=$DB_NAME size=$(du -h "$out" | cut -f1) duration=$((end - start))s"
