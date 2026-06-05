#!/usr/bin/env bash
# 重启 SkillBook：先停后启。
set -euo pipefail
cd "$(dirname "$0")"

./stop.sh || true
sleep 0.5
exec ./start.sh
