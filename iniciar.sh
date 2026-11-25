#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

HOST="${HOST:-${OPENARCHITECTO_HOST:-127.0.0.1}}"
PORT="${PORT:-${OPENARCHITECTO_PORT:-5173}}"

echo "====================================================="
echo "  OpenArchitecto Studio"
echo "  URL: http://${HOST}:${PORT}"
echo "====================================================="

if command -v node >/dev/null 2>&1 && [ -f "dist/servidor.js" ]; then
  exec node ./dist/servidor.js
elif command -v bun >/dev/null 2>&1; then
  exec bun run ./servidor.ts
elif command -v python3 >/dev/null 2>&1; then
  echo "[WARN] Running static HTTP fallback (diagram REST persistence disabled)."
  exec python3 -m http.server "$PORT" --bind "$HOST"
else
  echo "[ERROR] Node.js >= 18 (with dist/servidor.js), Bun, or Python 3 is required." >&2
  exit 1
fi
