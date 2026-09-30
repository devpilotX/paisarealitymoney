#!/usr/bin/env bash
# One-time app setup on the server (after bootstrap.sh). Idempotent.
#   sudo bash deploy/vps/setup-app.sh
# Creates the database and role, installs nginx config, the price cron, nightly
# database backups and PM2 boot persistence.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE=/etc/paisareality/paisareality.env

# Database role and database. The password is generated once and kept in the env file.
if ! grep -q '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null; then
  PW="$(openssl rand -hex 24)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'paisa') THEN CREATE ROLE paisa LOGIN; END IF;
END \$\$;
ALTER ROLE paisa PASSWORD '$PW';
SQL
  echo "DATABASE_URL=postgres://paisa:$PW@127.0.0.1:5432/paisareality" >> "$ENV_FILE"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='paisareality'" | grep -q 1 \
  || sudo -u postgres createdb -O paisa paisareality
chown root:paisa "$ENV_FILE"; chmod 640 "$ENV_FILE"; chgrp paisa /etc/paisareality; chmod 750 /etc/paisareality

# nginx
install -d /var/www/letsencrypt /etc/nginx/snippets /etc/ssl/paisareality
# Temporary self-signed pair so nginx can start before the first certificate exists.
if [ ! -e /etc/ssl/paisareality/fullchain.pem ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 -subj '/CN=paisareality.com' \
    -keyout /etc/ssl/paisareality/selfsigned.key -out /etc/ssl/paisareality/selfsigned.crt >/dev/null 2>&1
  ln -sfn /etc/ssl/paisareality/selfsigned.crt /etc/ssl/paisareality/fullchain.pem
  ln -sfn /etc/ssl/paisareality/selfsigned.key /etc/ssl/paisareality/privkey.pem
fi
# After every issue or renewal, point nginx at the Let's Encrypt files and reload.
install -d /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh <<'HOOK'
#!/bin/sh
L=/etc/letsencrypt/live/paisareality.com
[ -d "$L" ] || exit 0
ln -sfn "$L/fullchain.pem" /etc/ssl/paisareality/fullchain.pem
ln -sfn "$L/privkey.pem" /etc/ssl/paisareality/privkey.pem
systemctl reload nginx
HOOK
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh
install -m 644 "$SRC/deploy/nginx/cloudflare-realip.conf" /etc/nginx/conf.d/cloudflare-realip.conf
install -m 644 "$SRC/deploy/nginx/snippets/paisareality-tls.conf" /etc/nginx/snippets/
install -m 644 "$SRC/deploy/nginx/snippets/paisareality-proxy.conf" /etc/nginx/snippets/
install -m 644 "$SRC/deploy/nginx/paisareality.com.conf" /etc/nginx/sites-available/paisareality.com
ln -sfn /etc/nginx/sites-available/paisareality.com /etc/nginx/sites-enabled/paisareality.com
rm -f /etc/nginx/sites-enabled/default
sed -i 's/^\s*#\?\s*server_tokens .*/\tserver_tokens off;/' /etc/nginx/nginx.conf
nginx -t
systemctl reload nginx

# Price updates: systemd timer, five runs a day (see deploy/systemd/).
install -d -o paisa -g paisa /var/log/paisareality
install -m 750 -o root -g paisa "$SRC/deploy/vps/run-price-cron.sh" /usr/local/bin/paisareality-price-cron
install -m 644 "$SRC/deploy/systemd/paisareality-prices.service" /etc/systemd/system/
install -m 644 "$SRC/deploy/systemd/paisareality-prices.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable paisareality-prices.timer >/dev/null

# Nightly database backup at 02:30.
cat > /etc/cron.d/paisareality <<'CRON'
SHELL=/bin/bash
30 2 * * * postgres /usr/local/bin/paisareality-backup >> /var/log/paisareality/backup.log 2>&1
CRON
touch /var/log/paisareality/backup.log && chown postgres /var/log/paisareality/backup.log
install -m 755 "$SRC/deploy/vps/backup-db.sh" /usr/local/bin/paisareality-backup
install -d -o postgres -g postgres -m 700 /var/backups/paisareality
cat > /etc/logrotate.d/paisareality <<'ROT'
/var/log/paisareality/*.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
  copytruncate
}
ROT

# PM2 for the paisa user, started at boot by systemd.
env PATH="$PATH" pm2 startup systemd -u paisa --hp /home/paisa >/dev/null
systemctl enable pm2-paisa >/dev/null 2>&1 || true
sudo -u paisa bash -lc 'pm2 install pm2-logrotate >/dev/null 2>&1 || true'

echo SETUP_APP_DONE
