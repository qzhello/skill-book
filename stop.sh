#!/usr/bin/env bash
# 停止后台运行的 SkillBook。
set -euo pipefail
cd "$(dirname "$0")"

PIDFILE=".skillbook.pid"

if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE")"
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    # 最多等 3s 优雅退出，否则强杀
    for _ in $(seq 1 6); do
      kill -0 "$PID" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
    echo "已停止 SkillBook (pid $PID)"
  else
    echo "进程不存在 (pid $PID)，清理 pid 文件"
  fi
  rm -f "$PIDFILE"
else
  echo "未找到 pid 文件，按进程名兜底停止…"
  if pkill -f "skillbook -addr" 2>/dev/null; then
    echo "已停止"
  else
    echo "没有运行中的实例"
  fi
fi
