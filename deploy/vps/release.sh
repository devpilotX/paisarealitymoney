#!/usr/bin/env bash
# Build and switch to a new release with an automatic rollback.
#
#   sudo -u paisa bash deploy/vps/release.sh /tmp/paisareality-<sha>.tgz <sha>
#
# Layout:
#   /opt/paisareality/releases/<sha>/   full source + node_modules + .next
#   /opt/paisareality/current -> releases/<sha>   (PM2 runs from here)
#   /etc/paisareality/paisareality.env           secrets, linked in as .env
#
# The build happens in the release directory itself, so the absolute paths Next
# records in .next are already correct and nothing needs patching. The live site
# keeps serving the old release until the symlink flips. If the new release does
# not answer on /api/prices/national within 60 seconds, the symlink goes back.
set -euo pipefail

TARBALL="$1"
SHA="$2"
ROOT=/opt/paisareality
REL="$ROOT/releases/$SHA"
ENV_FILE=/etc/paisareality/paisareality.env
KEEP=5

log() { printf '[release %s] %s\n' "$(date '+%H:%M:%S')" "$*"; }

[ -f "$TARBALL" ] || { echo "no tarball at $TARBALL"; exit 1; }
[ -r "$ENV_FILE" ] || { echo "cannot read $ENV_FILE"; exit 1; }

log "unpacking $SHA"
rm -rf "$REL.partial"
mkdir -p "$REL.partial"
tar -xzf "$TARBALL" -C "$REL.partial"
ln -sfn "$ENV_FILE" "$REL.partial/.env"

cd "$REL.partial"
log "installing dependencies (npm ci)"
npm ci --no-audit --no-fund --loglevel=error

log "building"
NODE_OPTIONS=--max-old-space-size=3072 nice -n 10 npm run build > build.log 2>&1 || { tail -40 build.log; log "BUILD FAILED, live site untouched"; exit 1; }
tail -3 build.log

rm -rf "$REL"
mv "$REL.partial" "$REL"
# Next records the build directory; it was built as .partial, so point it at the final path.
grep -rl "$REL.partial" "$REL/.next" 2>/dev/null | xargs -r sed -i "s#$REL.partial#$REL#g"

PREV=""
if [ -L "$ROOT/current" ]; then
  PREV="$(readlink -f "$ROOT/current")"
  case "$PREV" in "$ROOT"/releases/*) [ -d "$PREV" ] || PREV="" ;; *) PREV="" ;; esac
fi
[ "$PREV" = "$REL" ] && PREV=""
log "switching current -> $SHA (previous: ${PREV:+${PREV##*/}})"
rm -rf "$ROOT/current.new"
ln -sfn "$REL" "$ROOT/current.new" && mv -Tf "$ROOT/current.new" "$ROOT/current"

if pm2 describe paisareality >/dev/null 2>&1; then
  pm2 restart paisareality --update-env >/dev/null
else
  pm2 start "$ROOT/current/deploy/vps/ecosystem.config.js" >/dev/null
fi
pm2 save >/dev/null

log "health check"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null -m 5 http://127.0.0.1:3000/api/prices/national; then
    log "healthy after $((i * 2))s"
    # Keep the newest $KEEP releases.
    ls -1dt "$ROOT"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
    log "done: $SHA is live"
    exit 0
  fi
  sleep 2
done

log "UNHEALTHY, rolling back"
if [ -n "$PREV" ] && [ -d "$PREV" ]; then
  ln -sfn "$PREV" "$ROOT/current.new" && mv -Tf "$ROOT/current.new" "$ROOT/current"
  pm2 restart paisareality --update-env >/dev/null
  log "rolled back to ${PREV##*/}"
fi
pm2 logs paisareality --lines 40 --nostream || true
exit 1
