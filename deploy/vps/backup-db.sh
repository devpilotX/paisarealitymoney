#!/usr/bin/env bash
# Nightly PostgreSQL backup, run as the postgres user from /etc/cron.d/paisareality.
# Keeps 14 days on this disk. A disk on the same server is not a real backup:
# copy /var/backups/paisareality off the box regularly (see README, Deployment).
set -euo pipefail
DIR=/var/backups/paisareality
STAMP="$(date +%Y%m%d-%H%M)"
pg_dump -Fc paisareality > "$DIR/paisareality-$STAMP.dump.tmp"
mv "$DIR/paisareality-$STAMP.dump.tmp" "$DIR/paisareality-$STAMP.dump"
find "$DIR" -name 'paisareality-*.dump' -mtime +14 -delete
echo "$(date -Is) backup ok $(du -h "$DIR/paisareality-$STAMP.dump" | cut -f1)"
