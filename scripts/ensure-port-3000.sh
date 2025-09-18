#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"

if ! command -v ss >/dev/null 2>&1 && ! command -v lsof >/dev/null 2>&1; then
  echo "[port-guard] Neither ss nor lsof is available; skipping port check" >&2
  exit 0
fi

PIDS=""
if command -v ss >/dev/null 2>&1; then
  # Extract PID from ss output
  PIDS=$(ss -ltnp | awk -v p=":$PORT" '$4 ~ p {print $7}' | sed -E 's/.*pid=([0-9]+).*/\1/' | tr '\n' ' ')
fi

if [ -z "$PIDS" ] && command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -t -i :$PORT || true)
fi

if [ -n "$PIDS" ]; then
  echo "[port-guard] Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS || true
else
  echo "[port-guard] Port $PORT is free."
fi
