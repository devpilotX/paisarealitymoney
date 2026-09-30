#!/usr/bin/env bash
# Called by paisareality-prices.service. Runs the price update and logs one line.
set -uo pipefail
SECRET="$(grep '^CRON_SECRET=' /etc/paisareality/paisareality.env | cut -d= -f2-)"
OUT="$(curl -sS -m 170 -H "Authorization: Bearer $SECRET" http://127.0.0.1:3000/api/cron/prices)"
CODE=$?
printf '%s exit=%s %s\n' "$(date -Is)" "$CODE" "$(printf '%s' "$OUT" | head -c 600)"
exit "$CODE"
