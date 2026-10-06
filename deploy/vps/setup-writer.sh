#!/usr/bin/env bash
# Install or update the article writer service. Idempotent; run as root from a release checkout:
#   bash deploy/vps/setup-writer.sh
#
#   - system user kirowriter (no login shell use, home /var/lib/kirowriter) with Kiro CLI
#   - the code in /opt/paisa-writer/current (deploy/writer plus the shared publishing rules)
#   - the Kiro agent "paisa-writer": web_fetch only, file and shell access denied
#   - systemd unit paisareality-writer.service on 127.0.0.1:5690
# The Kiro API key is never stored here: n8n sends it with each call (credential "Kiro API key").
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
U=kirowriter
H=/var/lib/kirowriter

need=()
for p in unzip poppler-utils python3 curl; do dpkg -s "$p" >/dev/null 2>&1 || need+=("$p"); done
[ "${#need[@]}" -eq 0 ] || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${need[@]}" >/dev/null

id "$U" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$H" --shell /usr/sbin/nologin "$U"
chmod 750 "$H"
if [ ! -x "$H/.local/bin/kiro-cli" ]; then
  sudo -u "$U" -H bash -c 'cd ~ && curl -fsSL https://cli.kiro.dev/install -o /tmp/kiro-install.sh && bash /tmp/kiro-install.sh >/dev/null && rm -f /tmp/kiro-install.sh'
fi
sudo -u "$U" -H "$H/.local/bin/kiro-cli" --version

# Leftovers from the first experiments.
rm -rf "$H/exp" "$H/kiro-test.sh" "$H/.kiro/agents/exp-web.json"

install -d -o "$U" -g "$U" -m 700 "$H/.kiro" "$H/.kiro/agents"
install -o "$U" -g "$U" -m 600 "$SRC/deploy/writer/paisa-writer.agent.json" "$H/.kiro/agents/paisa-writer.json"

STAMP="$(date +%Y%m%d%H%M%S)"
DEST="/opt/paisa-writer/releases/$STAMP"
install -d -m 755 "$DEST/deploy" "$DEST/src/lib"
cp -r "$SRC/deploy/writer" "$DEST/deploy/"
cp "$SRC/src/lib/article-core.ts" "$DEST/src/lib/"
printf '{ "private": true, "type": "module" }\n' > "$DEST/package.json"
chmod -R a+rX "$DEST"
ln -sfn "$DEST" /opt/paisa-writer/current.new && mv -Tf /opt/paisa-writer/current.new /opt/paisa-writer/current
ls -1dt /opt/paisa-writer/releases/*/ | tail -n +4 | xargs -r rm -rf

install -m 644 "$SRC/deploy/writer/paisareality-writer.service" /etc/systemd/system/paisareality-writer.service
systemctl daemon-reload
systemctl enable paisareality-writer.service >/dev/null
systemctl restart paisareality-writer.service
for i in $(seq 1 20); do curl -fsS -m 3 http://127.0.0.1:5690/health >/dev/null && break; sleep 1; done
curl -fsS -m 3 http://127.0.0.1:5690/health || { journalctl -u paisareality-writer -n 40 --no-pager; exit 1; }
echo
echo SETUP_WRITER_DONE
