#!/usr/bin/env bash
# Server watchdog, every 5 minutes from paisareality-watchdog.timer. It checks
# from inside the box, so it still works when n8n itself is down:
#   the site answering on 127.0.0.1:3000, n8n healthy, disk and memory headroom,
#   and the age of the last good backup.
# It messages Telegram only when the set of problems changes, including "all clear".
set -uo pipefail
. /etc/paisareality/backup.env
STATE=/var/lib/paisareality-backup/watchdog.state
problems=()

curl -fsS -m 10 -o /dev/null http://127.0.0.1:3000/api/prices/national || problems+=("Website is not answering on the server (pm2 app paisareality)")
curl -fsS -m 10 -o /dev/null http://127.0.0.1:5678/healthz || problems+=("n8n is not answering (docker container n8n)")

disk=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "$disk" -ge 85 ] && problems+=("Disk is ${disk}% full")

mem=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)
[ "$mem" -lt 250 ] && problems+=("Only ${mem} MB of memory available")

last=$(ls -1t /var/lib/paisareality-backup/outbox/paisareality-backup-*.tar.gz.gpg 2>/dev/null | head -1)
if [ -z "$last" ]; then
  problems+=("No backup file exists on the server")
else
  age_h=$(( ( $(date +%s) - $(stat -c %Y "$last") ) / 3600 ))
  [ "$age_h" -ge 8 ] && problems+=("Last backup is ${age_h} hours old (they run every 6 hours)")
fi

now="$(printf '%s\n' "${problems[@]:-}" | sed '/^$/d')"
before="$(cat "$STATE" 2>/dev/null || true)"
[ "$now" = "$before" ] && exit 0
printf '%s' "$now" > "$STATE"

if [ -n "$now" ]; then
  text="SERVER PROBLEM on $(hostname)
$(printf -- '- %s\n' "${problems[@]}")
$(date '+%d %b %Y %H:%M IST')"
else
  text="All clear on $(hostname): the earlier problem is resolved.
$(date '+%d %b %Y %H:%M IST')"
fi
curl -sS -m 20 -o /dev/null "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=${text}"
