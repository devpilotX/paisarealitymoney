#!/usr/bin/env bash
# Full disaster-recovery backup of the paisareality server, run as root by
# paisareality-backup.service (daily timer, or on demand from Telegram /backup).
#
# One encrypted file holds everything needed to carry on from a brand-new VPS:
#   db/paisareality.dump   the site database (users, articles, schemes, prices, alerts, ads...)
#   db/n8n.dump            n8n's database (workflows, credentials, execution history)
#   db/globals.sql         PostgreSQL roles, with their passwords
#   etc/                   /etc/paisareality, /etc/n8n, /etc/letsencrypt, nginx site files
#   app/source.tar.gz      the exact source of the live release
#   manifest.json          what is inside, with row counts and checksums
#
# The bundle is gpg AES-256 encrypted with the passphrase in /etc/paisareality/backup.key.
# Keep a copy of that passphrase OFF this server, or the backups cannot be opened.
# Runs four times a day. It lands in /var/lib/paisareality-backup/outbox, then n8n uploads it to Google Drive
# and Telegram. If n8n is unreachable, this script sends it to Telegram itself.
# Restore with deploy/vps/restore.sh.
set -Eeuo pipefail
umask 077

CONF=/etc/paisareality/backup.env
KEY=/etc/paisareality/backup.key
OUT=/var/lib/paisareality-backup/outbox
KEEP_LOCAL=14
HOST="$(hostname)"
STAMP="$(date +%Y%m%d-%H%M%S)"
NAME="paisareality-backup-$STAMP"
WORK="$(mktemp -d /var/tmp/paisa-backup.XXXXXX)"
STEP="start"
# daily (the 02:30 run, sent to Telegram too), interval (the other runs, Drive only), manual (/backup)
if [ -n "${BACKUP_TRIGGER:-}" ]; then KIND=manual; elif [ "$(date +%H)" = "02" ]; then KIND=daily; else KIND=interval; fi
START_TS=$(date +%s)

# shellcheck disable=SC1090
. "$CONF"   # TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, N8N_BACKUP_WEBHOOK, N8N_BACKUP_TOKEN

tg() {  # plain Telegram message, used only when something went wrong
  curl -sS -m 20 -o /dev/null "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=$1" || true
}

on_error() {
  local code=$?
  tg "BACKUP FAILED on ${HOST}
Step: ${STEP}
Exit code: ${code}
Time: $(date '+%d %b %Y %H:%M IST')
Log: journalctl -u paisareality-backup -n 50"
  jq -n --arg at "$(date -Is)" --arg step "$STEP" --argjson code "$code" \
    '{last_attempt:$at, ok:false, failed_step:$step, exit_code:$code}' > "$OUT/status-failed.json" || true
  chmod 644 "$OUT/status-failed.json" 2>/dev/null || true
  rm -rf "$WORK"
  exit "$code"
}
trap on_error ERR
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/$NAME"/{db,etc,app}
B="$WORK/$NAME"

STEP="dump site database"
sudo -u postgres pg_dump -Fc -Z 6 paisareality > "$B/db/paisareality.dump"

STEP="dump n8n database"
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='n8n'" | grep -q 1; then
  sudo -u postgres pg_dump -Fc -Z 6 n8n > "$B/db/n8n.dump"
fi

STEP="dump roles"
sudo -u postgres pg_dumpall --globals-only > "$B/db/globals.sql"

STEP="copy settings and certificates"
cp -a /etc/paisareality "$B/etc/paisareality"
rm -f "$B/etc/paisareality/backup.key"             # never ship the key inside what it locks
[ -d /etc/n8n ] && cp -a /etc/n8n "$B/etc/n8n"
[ -d /etc/letsencrypt ] && tar -C /etc -czf "$B/etc/letsencrypt.tar.gz" letsencrypt
mkdir -p "$B/etc/nginx"
cp -aL /etc/nginx/sites-available/paisareality.com /etc/nginx/sites-available/n8n.paisareality.com "$B/etc/nginx/" 2>/dev/null || true

STEP="copy live source"
REL="$(readlink -f /opt/paisareality/current)"
tar -C "$REL" --exclude=./node_modules --exclude=./.next --exclude=./.env --exclude=./build.log \
    -czf "$B/app/source.tar.gz" .
echo "${REL##*/}" > "$B/app/RELEASE"

STEP="write manifest"
counts="$(sudo -u postgres psql -d paisareality -tA -F '=' -c "
  SELECT 'users', count(*) FROM users UNION ALL
  SELECT 'blog_posts', count(*) FROM blog_posts UNION ALL
  SELECT 'schemes', count(*) FROM schemes UNION ALL
  SELECT 'scholarships', count(*) FROM scholarships UNION ALL
  SELECT 'subscribers', count(*) FROM subscribers UNION ALL
  SELECT 'price_alerts', count(*) FROM price_alerts UNION ALL
  SELECT 'contact_messages', count(*) FROM contact_messages UNION ALL
  SELECT 'gold_prices', count(*) FROM gold_prices")"
counts_json="$(printf '%s\n' "$counts" | jq -R 'split("=") | {(.[0]): (.[1]|tonumber)}' | jq -s add)"
(cd "$B" && find . -type f ! -name manifest.json -print0 | sort -z | xargs -0 sha256sum) > "$WORK/sums"
jq -n --arg name "$NAME" --arg host "$HOST" --arg at "$(date -Is)" --arg release "${REL##*/}" \
      --argjson counts "$counts_json" --rawfile sums "$WORK/sums" \
  '{name:$name, host:$host, created_at:$at, release:$release, counts:$counts,
    files:($sums | split("\n") | map(select(length>0) | split("  ") | {sha256:.[0], path:.[1]}))}' \
  > "$B/manifest.json"

STEP="encrypt"
FILE="$OUT/$NAME.tar.gz.gpg"
tar -C "$WORK" -czf - "$NAME" | gpg --batch --yes --quiet --symmetric --cipher-algo AES256 \
  --pinentry-mode loopback --passphrase-file "$KEY" -o "$FILE.part"
mv "$FILE.part" "$FILE"
chmod 644 "$FILE"   # already encrypted; n8n (uid 1000) must be able to read it

STEP="verify"
gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$KEY" -d "$FILE" | tar -tzf - > "$WORK/list"
grep -q "$NAME/db/paisareality.dump" "$WORK/list"
SIZE=$(stat -c %s "$FILE")
SHA=$(sha256sum "$FILE" | cut -d' ' -f1)

STEP="prune local copies"
ls -1t "$OUT"/paisareality-backup-*.tar.gz.gpg | tail -n +$((KEEP_LOCAL + 1)) | xargs -r rm -f
rm -f "$OUT/status-failed.json"

STEP="write status"
DURATION=$(( $(date +%s) - START_TS ))
jq -n --arg file "$NAME.tar.gz.gpg" --arg at "$(date -Is)" --arg sha "$SHA" --arg host "$HOST" \
      --argjson size "$SIZE" --argjson seconds "$DURATION" --arg release "${REL##*/}" \
      --argjson counts "$counts_json" --arg kind "$KIND" \
  '{ok:true, file:$file, created_at:$at, sha256:$sha, size:$size, seconds:$seconds,
    host:$host, release:$release, kind:$kind, counts:$counts}' > "$OUT/status.json.part"
mv "$OUT/status.json.part" "$OUT/status.json"
chmod 644 "$OUT/status.json"

STEP="hand over to n8n"
if curl -fsS -m 30 -o /dev/null -X POST "$N8N_BACKUP_WEBHOOK" \
     -H "X-Backup-Token: $N8N_BACKUP_TOKEN" -H 'Content-Type: application/json' \
     --data-binary @"$OUT/status.json"; then
  echo "$(date -Is) backup ok $NAME ($SIZE bytes, ${DURATION}s), handed to n8n"
else
  # n8n is down: still get the file off this machine.
  STEP="fallback upload to Telegram"
  if [ "$SIZE" -lt 49000000 ]; then
    curl -fsS -m 120 -o /dev/null "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
      -F "chat_id=${TELEGRAM_CHAT_ID}" -F "document=@${FILE}" \
      -F "caption=Backup ${NAME} ($((SIZE / 1024)) KB). n8n was unreachable, so it was sent directly and NOT uploaded to Google Drive."
  else
    tg "Backup ${NAME} was created (${SIZE} bytes) but n8n is unreachable and the file is too big for Telegram. It is only on the server."
  fi
  echo "$(date -Is) backup ok $NAME, n8n unreachable, sent to Telegram directly"
fi
