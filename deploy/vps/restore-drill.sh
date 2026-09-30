#!/usr/bin/env bash
# Restore drill: prove the newest backup opens and restores, without touching live data.
#   sudo bash deploy/vps/restore-drill.sh [--notify] [backup.tar.gz.gpg]
# Runs weekly from paisareality-restore-drill.timer with --notify (result to Telegram).
# Decrypts with /etc/paisareality/backup.key, checks every checksum in the manifest,
# restores both databases into throwaway databases, compares row counts with the
# manifest, then drops the throwaway databases. Exit code 0 means the backup is good.
set -Eeuo pipefail
NOTIFY=0
if [ "${1:-}" = "--notify" ]; then NOTIFY=1; shift; fi

notify() {
  [ "$NOTIFY" = 1 ] || return 0
  # shellcheck disable=SC1091
  . /etc/paisareality/backup.env
  curl -sS -m 20 -o /dev/null "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=$1" || true
}
on_error() { notify "RESTORE DRILL FAILED on $(hostname): the newest backup could not be restored. Run: sudo /usr/local/bin/paisareality-restore-drill"; }
trap on_error ERR

OUT=/var/lib/paisareality-backup/outbox
FILE="${1:-$(ls -1t "$OUT"/paisareality-backup-*.tar.gz.gpg | head -1)}"
WORK="$(mktemp -d /var/tmp/drill.XXXXXX)"
cleanup() {
  rm -rf "$WORK"
  sudo -u postgres dropdb --if-exists drill_paisareality
  sudo -u postgres dropdb --if-exists drill_n8n
}
trap cleanup EXIT
echo "$(date -Is) drill on $(basename "$FILE")"

gpg --batch --quiet --pinentry-mode loopback --passphrase-file /etc/paisareality/backup.key -d "$FILE" | tar -xzf - -C "$WORK"
B="$(ls -d "$WORK"/paisareality-backup-*)"
(cd "$B" && jq -r '.files[] | "\(.sha256)  \(.path)"' manifest.json | sha256sum -c --quiet)
echo "checksums: all $(jq '.files | length' "$B/manifest.json") files match"

for db in paisareality n8n; do
  [ -f "$B/db/$db.dump" ] || continue
  sudo -u postgres dropdb --if-exists "drill_$db"
  sudo -u postgres createdb "drill_$db"
  # Read by root and piped in: the postgres user cannot open files in the root-only work dir.
  sudo -u postgres pg_restore --no-owner --no-privileges --exit-on-error -d "drill_$db" < "$B/db/$db.dump"
  echo "restored $db into drill_$db"
done

q() { sudo -u postgres psql -d "$1" -qtAc "$2"; }
fail=0
for t in users blog_posts schemes scholarships subscribers price_alerts contact_messages banks cities; do
  want="$(jq -r --arg t "$t" '.counts[$t] // empty' "$B/manifest.json")"
  got="$(q drill_paisareality "SELECT count(*) FROM $t")"
  printf '  %-17s restored %-6s manifest %s\n' "$t" "$got" "${want:--}"
  if [ -n "$want" ] && [ "$want" != "$got" ]; then fail=1; fi
done
if [ -f "$B/db/n8n.dump" ]; then
  echo "  n8n: $(q drill_n8n 'SELECT count(*) FROM workflow_entity') workflows, $(q drill_n8n 'SELECT count(*) FROM credentials_entity') credentials"
fi
tar -tzf "$B/app/source.tar.gz" ./deploy/vps/restore.sh >/dev/null && echo "  restore.sh is inside the backup"
[ -f "$B/etc/paisareality/paisareality.env" ] && echo "  site settings present"
[ -f "$B/etc/n8n/n8n.env" ] && echo "  n8n settings and encryption key present"
[ -f "$B/etc/letsencrypt.tar.gz" ] && echo "  certificates present"

if [ "$fail" = 0 ]; then
  echo "DRILL PASSED"
  notify "Weekly restore drill passed: $(basename "$FILE") decrypted, all checksums matched, both databases restored and the row counts agree."
else
  echo "DRILL FAILED: counts differ from the manifest"
  notify "RESTORE DRILL FAILED on $(hostname): restored row counts differ from the backup manifest."
  exit 1
fi
