#!/usr/bin/env bash
# One-time server setup for paisareality on a fresh Ubuntu 24.04 (arm64).
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

# 2 GB swap so a Next.js build cannot OOM a 4 GB box
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

timedatectl set-timezone Asia/Kolkata
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl gnupg git build-essential python3 nginx postgresql postgresql-contrib \
  certbot python3-certbot-nginx fail2ban unattended-upgrades ufw jq gnupg docker.io docker-compose-v2

# Node 24 LTS
if ! command -v node >/dev/null || ! node -v | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2@6

# Firewall: SSH, HTTP, HTTPS only
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

systemctl enable --now fail2ban postgresql nginx
dpkg-reconfigure -f noninteractive unattended-upgrades

# App user and directories
id paisa >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/paisa --shell /bin/bash paisa
mkdir -p /opt/paisareality /etc/paisareality /var/backups/paisareality
chown paisa:paisa /opt/paisareality /var/backups/paisareality

node -v; npm -v; pm2 -v; psql --version; nginx -v
echo BOOTSTRAP_DONE
