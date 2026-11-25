#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js >= 18 is required. Install Node.js from https://nodejs.org/" >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "${NODE_MAJOR}" -lt 18 ]; then
  echo "[ERROR] Node.js >= 18 is required (found $(node -v))." >&2
  exit 1
fi

if [ ! -d "node_modules/@modelcontextprotocol/sdk" ]; then
  echo "[INFO] Installing dependencies..."
  npm install
fi

if [ ! -f "dist/mcp-server.js" ] || [ ! -f "dist/servidor.js" ]; then
  echo "[INFO] Building TypeScript artifacts..."
  npm run build
fi

chmod +x dist/mcp-server.js dist/servidor.js scripts/install.mjs iniciar.sh || true

exec node scripts/install.mjs "$@"
