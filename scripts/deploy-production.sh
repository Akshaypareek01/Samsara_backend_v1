#!/usr/bin/env bash
# Restart production API after pulling latest main (wellness feedback routes, etc.)
set -euo pipefail

APP_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

echo "→ Pulling latest main…"
git pull origin main

echo "→ Installing dependencies…"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "→ Restarting PM2…"
pm2 restart ecosystem.config.json --update-env || pm2 start ecosystem.config.json

echo "→ Done. Test:"
echo "   curl -sI https://apis-samsarawellness.in/v1/wellness-feedback/form | head -1"
