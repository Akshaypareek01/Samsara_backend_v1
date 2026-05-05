#!/usr/bin/env bash
# Free the TCP port the backend listens on (fixes EADDRINUSE).
# Usage: bash scripts/free-backend-port.sh [PORT]
# Default PORT is 8000 (override if your .env uses another PORT).
set -euo pipefail
PORT="${1:-8000}"
PIDS="$(lsof -ti tcp:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -z "${PIDS}" ]]; then
  echo "No LISTEN process on port ${PORT}."
  exit 0
fi
echo "Killing listener(s) on port ${PORT}: ${PIDS}"
kill ${PIDS} || true
sleep 0.5
if lsof -ti tcp:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Still in use; sending SIGKILL..."
  kill -9 ${PIDS} || true
fi
echo "Port ${PORT} should be free now."
