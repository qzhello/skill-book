#!/usr/bin/env bash
# 后台启动 SkillBook（不阻塞当前终端）。若已在运行则直接复用。
set -euo pipefail
cd "$(dirname "$0")"

ADDR="${SKILLBOOK_ADDR:-127.0.0.1:7777}"
PIDFILE=".skillbook.pid"
LOGFILE="skillbook.log"

# 已在运行？
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "SkillBook 已在运行 (pid $(cat "$PIDFILE"))  →  http://${ADDR}"
  ( command -v open >/dev/null && open "http://${ADDR}" ) || true
  exit 0
fi
rm -f "$PIDFILE"

echo "构建中…"
go build -o skillbook ./cmd/skillbook

# 后台启动，记录 pid + 日志
nohup ./skillbook -addr "${ADDR}" > "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"

# 等待端口就绪（最多 ~5s）
for _ in $(seq 1 10); do
  if curl -s -m 1 -o /dev/null "http://${ADDR}/" 2>/dev/null; then break; fi
  sleep 0.5
done

( command -v open >/dev/null && open "http://${ADDR}" ) || true
echo "SkillBook 已启动 (pid $(cat "$PIDFILE"))  →  http://${ADDR}"
echo "  日志: ./${LOGFILE}    停止: ./stop.sh    重启: ./restart.sh"
