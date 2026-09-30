#!/usr/bin/env bash
# Install or update n8n at https://n8n.paisareality.com. Idempotent; run as root:
#   N8N_OWNER_EMAIL=... N8N_OWNER_PASSWORD=... bash deploy/vps/setup-n8n.sh
# The owner variables are only needed the first time (to create the login).
#
# What it does:
#   - n8n in Docker (deploy/n8n/compose.yml), its data in the host PostgreSQL (database n8n)
#   - a read-only PostgreSQL role for the workflows (paisa_ro, column-level grants)
#   - nginx site and a certificate that covers n8n.paisareality.com
#   - the owner account, the credentials and the workflows in deploy/n8n/workflows,
#     published. Workflows that already exist in n8n are left alone, so edits made
#     in the editor survive a re-run. To take the repo version of existing ones, run with
#     N8N_REPLACE="<workflow id> ..." (or delete the workflow in n8n first).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
ENV=/etc/n8n/n8n.env
BK=/etc/paisareality/backup.env
[ -f "$BK" ] || { echo "missing $BK (Telegram token, chat id, backup webhook token)"; exit 1; }
. "$BK"
rnd() { openssl rand -hex "$1"; }
psql_q() { sudo -u postgres psql -v ON_ERROR_STOP=1 -qtA "$@"; }

command -v docker >/dev/null || { apt-get update -qq; DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 jq; }
systemctl enable --now docker >/dev/null

# --- settings, generated once --------------------------------------------------
install -d -m 750 /etc/n8n
if [ ! -f "$ENV" ]; then
  cat > "$ENV" <<EOF
# n8n settings. root 0600. N8N_ENCRYPTION_KEY protects every stored credential:
# it is part of the backup, and a restore must use the same value.
N8N_ENCRYPTION_KEY=$(rnd 32)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=127.0.0.1
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=$(rnd 24)
N8N_HOST=n8n.paisareality.com
N8N_PROTOCOL=https
N8N_PORT=5678
N8N_LISTEN_ADDRESS=127.0.0.1
N8N_EDITOR_BASE_URL=https://n8n.paisareality.com/
N8N_WEBHOOK_URL=https://n8n.paisareality.com/
N8N_PROXY_HOPS=1
N8N_SECURE_COOKIE=true
GENERIC_TIMEZONE=Asia/Kolkata
TZ=Asia/Kolkata
N8N_DIAGNOSTICS_ENABLED=false
N8N_PERSONALIZATION_ENABLED=false
N8N_HIRING_BANNER_ENABLED=false
N8N_RUNNERS_TASK_TIMEOUT=300
N8N_BLOCK_ENV_ACCESS_IN_NODE=true
N8N_RESTRICT_FILE_ACCESS_TO=/home/node/.n8n-files
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336
EXECUTIONS_DATA_PRUNE_MAX_COUNT=20000
N8N_LOG_LEVEL=info
EOF
  # Password-reset mail for the n8n login goes through the site's mailbox.
  APPENV=/etc/paisareality/paisareality.env
  if grep -q '^SMTP_HOST=' "$APPENV"; then
    {
      echo "N8N_EMAIL_MODE=smtp"
      echo "N8N_SMTP_HOST=$(grep '^SMTP_HOST=' "$APPENV" | cut -d= -f2-)"
      echo "N8N_SMTP_PORT=$(grep '^SMTP_PORT=' "$APPENV" | cut -d= -f2-)"
      echo "N8N_SMTP_USER=$(grep '^SMTP_USER=' "$APPENV" | cut -d= -f2-)"
      echo "N8N_SMTP_PASS=$(grep '^SMTP_PASSWORD=' "$APPENV" | cut -d= -f2-)"
      echo "N8N_SMTP_SENDER=Paisa Reality <$(grep '^SMTP_USER=' "$APPENV" | cut -d= -f2-)>"
      echo "N8N_SMTP_SSL=true"
    } >> "$ENV"
  fi
fi
chmod 600 "$ENV"
[ -f /etc/n8n/workflow-db.env ] || echo "PAISA_RO_PASSWORD=$(rnd 24)" > /etc/n8n/workflow-db.env
chmod 600 /etc/n8n/workflow-db.env
. /etc/n8n/workflow-db.env
N8N_DB_PW="$(grep '^DB_POSTGRESDB_PASSWORD=' "$ENV" | cut -d= -f2-)"

# --- PostgreSQL ----------------------------------------------------------------
psql_q <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'n8n') THEN CREATE ROLE n8n LOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'paisa_ro') THEN CREATE ROLE paisa_ro LOGIN; END IF;
END \$\$;
ALTER ROLE n8n PASSWORD '$N8N_DB_PW';
ALTER ROLE paisa_ro PASSWORD '$PAISA_RO_PASSWORD';
SQL
psql_q -c "SELECT 1 FROM pg_database WHERE datname='n8n'" | grep -q 1 || sudo -u postgres createdb -O n8n n8n
# Least privilege for the workflows: counts, dates and the contact inbox only.
# No password hashes, tokens or payment ids.
psql_q -d paisareality <<'SQL'
GRANT CONNECT ON DATABASE paisareality TO paisa_ro;
GRANT USAGE ON SCHEMA public TO paisa_ro;
GRANT SELECT (id, name, email, plan, created_at) ON users TO paisa_ro;
GRANT SELECT (id, status, source, created_at) ON subscribers TO paisa_ro;
GRANT SELECT (id, commodity, active, created_at) ON price_alerts TO paisa_ro;
GRANT SELECT ON contact_messages, blog_posts, schemes, scholarships, gold_prices, silver_prices, fuel_prices, lpg_prices TO paisa_ro;
SQL

# --- directories ---------------------------------------------------------------
install -d -m 750 -o 1000 -g 1000 /var/lib/n8n
install -d -m 755 /var/lib/paisareality-backup/outbox
install -d -m 770 -o 1000 -g 1000 /var/lib/paisareality-backup/requests
install -d -m 755 /opt/n8n
install -m 644 "$SRC/deploy/n8n/compose.yml" /opt/n8n/compose.yml

# --- nginx and certificate -----------------------------------------------------
install -m 644 "$SRC/deploy/nginx/snippets/n8n-proxy.conf" /etc/nginx/snippets/
install -m 644 "$SRC/deploy/nginx/n8n.paisareality.com.conf" /etc/nginx/sites-available/n8n.paisareality.com
ln -sfn /etc/nginx/sites-available/n8n.paisareality.com /etc/nginx/sites-enabled/n8n.paisareality.com
nginx -t -q && systemctl reload nginx
if ! openssl x509 -in /etc/letsencrypt/live/paisareality.com/cert.pem -noout -ext subjectAltName 2>/dev/null | grep -q 'n8n.paisareality.com'; then
  certbot certonly --webroot -w /var/www/letsencrypt --cert-name paisareality.com --expand \
    -d paisareality.com -d www.paisareality.com -d admin.paisareality.com -d n8n.paisareality.com \
    --non-interactive --agree-tos -m "${N8N_OWNER_EMAIL:-dipanshukumar117@gmail.com}" --no-eff-email
  /etc/letsencrypt/renewal-hooks/deploy/paisareality.sh
fi

# --- start n8n -----------------------------------------------------------------
cd /opt/n8n
docker compose pull -q
docker compose up -d
for i in $(seq 1 60); do curl -fsS -m 3 -o /dev/null http://127.0.0.1:5678/healthz && break; sleep 3; done
curl -fsS -m 3 -o /dev/null http://127.0.0.1:5678/healthz || { docker logs --tail 60 n8n; exit 1; }
# healthz answers before the database migrations finish on first boot; wait for the REST API.
for i in $(seq 1 60); do curl -fsS -m 3 -o /dev/null http://127.0.0.1:5678/rest/settings && break; sleep 3; done

# --- owner account ---------------------------------------------------------------
# n8n starts with a placeholder owner that has no email; setting it up claims the instance.
if sudo -u postgres psql -d n8n -qtAc 'SELECT 1 FROM "user" WHERE "roleSlug" = '"'global:owner'"' AND email IS NULL' | grep -q 1; then
  : "${N8N_OWNER_EMAIL:?set N8N_OWNER_EMAIL for the first run}" "${N8N_OWNER_PASSWORD:?set N8N_OWNER_PASSWORD for the first run}"
  jq -n --arg e "$N8N_OWNER_EMAIL" --arg p "$N8N_OWNER_PASSWORD" \
     '{email:$e, firstName:"Dipanshu", lastName:"Kumar", password:$p}' \
    | curl -fsS -o /dev/null -X POST http://127.0.0.1:5678/rest/owner/setup -H 'Content-Type: application/json' --data-binary @-
  echo "owner account created for $N8N_OWNER_EMAIL"
fi

# --- credentials and workflows ---------------------------------------------------
exists() { sudo -u postgres psql -d n8n -qtAc "SELECT 1 FROM $1 WHERE id = '$2'" | grep -q 1; }
IMP=/var/lib/n8n/import
rm -rf "$IMP"; install -d -m 700 -o 1000 -g 1000 "$IMP" "$IMP/workflows"
trap 'rm -rf "$IMP"' EXIT

creds='[]'
add_cred() { creds="$(jq --argjson c "$1" '. + [$c]' <<<"$creds")"; }
exists credentials_entity paisaTelegramBot || add_cred "$(jq -n --arg t "$TELEGRAM_BOT_TOKEN" \
  '{id:"paisaTelegramBot", name:"Telegram: Paisareality_bot", type:"telegramApi", data:{accessToken:$t}}')"
exists credentials_entity paisaPostgresRO1 || add_cred "$(jq -n --arg p "$PAISA_RO_PASSWORD" \
  '{id:"paisaPostgresRO1", name:"Postgres: paisareality (read-only)", type:"postgres",
    data:{host:"127.0.0.1", port:5432, database:"paisareality", user:"paisa_ro", password:$p, ssl:"disable", allowUnauthorizedCerts:false, sshTunnel:false}}')"
exists credentials_entity paisaBackupToken || add_cred "$(jq -n --arg v "$N8N_BACKUP_TOKEN" \
  '{id:"paisaBackupToken", name:"Backup webhook token", type:"httpHeaderAuth", data:{name:"X-Backup-Token", value:$v}}')"
exists credentials_entity paisaGoogleDrive || add_cred "$(jq -n --arg i "${GOOGLE_CLIENT_ID:-}" --arg s "${GOOGLE_CLIENT_SECRET:-}" \
  '{id:"paisaGoogleDrive", name:"Google Drive: backups", type:"googleDriveOAuth2Api", data:{clientId:$i, clientSecret:$s}}')"
# The site's CRON_SECRET, for the data-health, link-check and weekly-post workflows.
CRON_SECRET_VALUE="$(sed -n 's/^CRON_SECRET=//p' /etc/paisareality/paisareality.env | tr -d '"')"
exists credentials_entity paisaCronSecret || add_cred "$(jq -n --arg v "Bearer $CRON_SECRET_VALUE" \
  '{id:"paisaCronSecret", name:"Site cron secret", type:"httpHeaderAuth", data:{name:"Authorization", value:$v}}')"
if [ "$(jq length <<<"$creds")" -gt 0 ]; then
  printf '%s' "$creds" > "$IMP/credentials.json"; chown 1000:1000 "$IMP/credentials.json"
  docker exec -u node n8n n8n import:credentials --input=/home/node/.n8n/import/credentials.json
fi

new_ids=()
for f in "$SRC"/deploy/n8n/workflows/*.json; do
  id="$(jq -r .id "$f")"
  # N8N_REPLACE="id1 id2" re-imports those workflows from the repo, replacing editor edits.
  if exists workflow_entity "$id" && [[ " ${N8N_REPLACE:-} " != *" $id "* ]]; then continue; fi
  sed "s/__CHAT_ID__/${TELEGRAM_CHAT_ID}/g" "$f" > "$IMP/workflows/$(basename "$f")"
  new_ids+=("$id")
done
if [ "${#new_ids[@]}" -gt 0 ]; then
  chown -R 1000:1000 "$IMP"
  docker exec -u node n8n n8n import:workflow --separate --input=/home/node/.n8n/import/workflows
  for id in "${new_ids[@]}"; do docker exec -u node n8n n8n publish:workflow --id="$id"; done
  docker compose restart n8n >/dev/null
  for i in $(seq 1 60); do curl -fsS -m 3 -o /dev/null http://127.0.0.1:5678/healthz && break; sleep 3; done
  echo "imported and published: ${new_ids[*]}"
fi
echo SETUP_N8N_DONE
