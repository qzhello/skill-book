#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
ADDR="${SKILLBOOK_ADDR:-127.0.0.1:7777}"
go build -o skillbook ./cmd/skillbook
( sleep 1; (command -v open >/dev/null && open "http://${ADDR}") || true ) &
exec ./skillbook -addr "${ADDR}"
