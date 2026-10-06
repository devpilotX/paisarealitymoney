#!/usr/bin/env bash
# Install the nginx sites and snippets from this checkout, test, and reload. Run as root.
# Restores the previous files if `nginx -t` fails, so a bad config never goes live.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
BK="$(mktemp -d)"
cp -a /etc/nginx/sites-available /etc/nginx/snippets /etc/nginx/sites-enabled "$BK/"

install -m 644 "$SRC/deploy/nginx/snippets/"*.conf /etc/nginx/snippets/
install -m 644 "$SRC/deploy/nginx/cloudflare-realip.conf" /etc/nginx/conf.d/cloudflare-realip.conf
install -m 644 "$SRC/deploy/nginx/paisareality.com.conf" /etc/nginx/sites-available/paisareality.com
install -m 644 "$SRC/deploy/nginx/n8n.paisareality.com.conf" /etc/nginx/sites-available/n8n.paisareality.com
install -m 644 "$SRC/deploy/nginx/default-catchall.conf" /etc/nginx/sites-available/000-default-catchall
ln -sfn /etc/nginx/sites-available/000-default-catchall /etc/nginx/sites-enabled/000-default-catchall
rm -f /etc/nginx/sites-enabled/default

if nginx -t 2>&1; then
  systemctl reload nginx
  echo APPLY_NGINX_DONE
else
  echo "nginx -t failed, restoring the previous configuration"
  rm -rf /etc/nginx/sites-available /etc/nginx/snippets /etc/nginx/sites-enabled
  cp -a "$BK/sites-available" "$BK/snippets" "$BK/sites-enabled" /etc/nginx/
  nginx -t && systemctl reload nginx
  exit 1
fi
rm -rf "$BK"
