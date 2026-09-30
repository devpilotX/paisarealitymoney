#!/usr/bin/env bash
# Rebuild the whole paisareality server from one backup file, on a fresh Ubuntu 24.04 VPS.
#
#   1. In Cloudflare, point paisareality.com, www, admin and n8n at the new server's IP.
#   2. Copy the newest backup (Google Drive folder "Paisa Reality Backups", or Telegram) to the server.
#   3. Get this script out of the backup itself, then run it:
#        gpg -d paisareality-backup-XXXX.tar.gz.gpg | tar -xzO --wildcards '*/app/source.tar.gz' \
#          | tar -xzO ./deploy/vps/restore.sh > restore.sh
#        sudo bash restore.sh paisareality-backup-XXXX.tar.gz.gpg
#      It asks for the backup passphrase (or set BACKUP_PASSPHRASE).
#
# Result: the same site, database, articles, users, settings, certificates, n8n
# workflows and credentials as at the moment of the backup. Logged-in sessions stay
# valid because the secrets are restored too.
set -Eeuo pipefail
FILE="${1:?usage: sudo bash restore.sh <backup.tar.gz.gpg>}"
[ -f "$FILE" ] || { echo "no such file: $FILE"; exit 1; }
[ "$(id -u)" = 0 ] || { echo "run as root (sudo)"; exit 1; }
log() { printf '\n[restore %s] %s\n' "$(date +%H:%M:%S)" "$*"; }

PASS="${BACKUP_PASSPHRASE:-}"
[ -n "$PASS" ] || { read -rsp 'Backup passphrase: ' PASS; echo; }
WORK="/root/restore-$(date +%Y%m%d-%H%M%S)"
install -d -m 700 "$WORK"
printf '%s' "$PASS" > "$WORK/key"; chmod 600 "$WORK/key"

log "decrypting"
command -v gpg >/dev/null || { apt-get update -qq; apt-get install -y -qq gnupg jq; }
command -v jq >/dev/null || apt-get install -y -qq jq
gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$WORK/key" -d "$FILE" | tar -xzf - -C "$WORK"
B="$(ls -d "$WORK"/paisareality-backup-* | head -1)"
log "checking file checksums against the manifest"
(cd "$B" && jq -r '.files[] | "\(.sha256)  \(.path)"' manifest.json | sha256sum -c --quiet)
jq -r '"backup of \(.host) taken \(.created_at), release \(.release)", (.counts | to_entries | map("  \(.key): \(.value)") | .[])' "$B/manifest.json"

SRC="$WORK/src"; install -d "$SRC"
tar -xzf "$B/app/source.tar.gz" -C "$SRC"
REL="$(cat "$B/app/RELEASE")"

log "installing system packages (bootstrap.sh)"
bash "$SRC/deploy/vps/bootstrap.sh"

log "restoring settings and certificates"
install -d -m 750 -g paisa /etc/paisareality
cp -a "$B/etc/paisareality/." /etc/paisareality/
install -m 600 "$WORK/key" /etc/paisareality/backup.key
chown root:paisa /etc/paisareality/paisareality.env; chmod 640 /etc/paisareality/paisareality.env
chmod 600 /etc/paisareality/backup.env
[ -d "$B/etc/n8n" ] && { install -d -m 750 /etc/n8n; cp -a "$B/etc/n8n/." /etc/n8n/; chmod 600 /etc/n8n/*.env; }
[ -f "$B/etc/letsencrypt.tar.gz" ] && tar -xzf "$B/etc/letsencrypt.tar.gz" -C /etc

log "restoring databases"
systemctl enable --now postgresql
# Roles first, with their original passwords (errors for roles that already exist are expected).
sudo -u postgres psql -q -f "$B/db/globals.sql" >/dev/null 2>&1 || true
for db in paisareality n8n; do
  [ -f "$B/db/$db.dump" ] || continue
  owner=paisa; [ "$db" = n8n ] && owner=n8n
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1; then
    echo "database $db already exists on this server, refusing to overwrite it"; exit 1
  fi
  sudo -u postgres createdb -O "$owner" "$db"
  sudo -u postgres pg_restore -d "$db" --exit-on-error "$B/db/$db.dump"
  echo "restored $db"
done

log "configuring the site (setup-app.sh)"
bash "$SRC/deploy/vps/setup-app.sh"
[ -x /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh ] && /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh

log "building and starting release $REL"
TGZ="/opt/paisareality/paisareality-$REL.tgz"
tar -C "$SRC" -czf "$TGZ" .
chown paisa "$TGZ"
sudo -u paisa bash "$SRC/deploy/vps/release.sh" "$TGZ" "$REL"
rm -f "$TGZ"

log "starting n8n (setup-n8n.sh)"
bash "$SRC/deploy/vps/setup-n8n.sh"

log "checks"
curl -fsS -o /dev/null -w 'site on 127.0.0.1:3000: HTTP %{http_code}\n' http://127.0.0.1:3000/api/prices/national
curl -fsS -o /dev/null -w 'n8n on 127.0.0.1:5678: HTTP %{http_code}\n' http://127.0.0.1:5678/healthz
systemctl start paisareality-prices.service || true
rm -f "$WORK/key"
echo
echo "Restore finished. Remaining by hand:"
echo "  - if the certificate had expired, run: certbot renew && /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh"
echo "  - check https://paisareality.com and https://n8n.paisareality.com, then run: systemctl start paisareality-backup"
echo "  - the decrypted copy is in $WORK; delete it when you are satisfied: rm -rf $WORK"
