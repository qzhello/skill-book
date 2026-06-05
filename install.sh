#!/usr/bin/env bash
# SkillBook 环境一键准备脚本（目前仅支持 macOS）
# 作用：检测并安装 Homebrew 与 Go(>=1.25)，随后编译出本机可执行文件 skillbook。
# 不会写入任何密钥；不联网上传任何数据。
set -euo pipefail

MIN_GO_MINOR=25            # 需要 go1.25+
BIN_NAME="skillbook"
ENTRY="./cmd/skillbook"

say()  { printf '\033[32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[!] \033[0m%s\n' "$*"; }
die()  { printf '\033[31m[x] \033[0m%s\n' "$*" >&2; exit 1; }

# 1) 平台校验
[ "$(uname -s)" = "Darwin" ] || die "目前仅支持 macOS。其它系统请参考 README 手动安装 Go 后执行: go build -o $BIN_NAME $ENTRY"

# 2) Homebrew
if ! command -v brew >/dev/null 2>&1; then
  say "未检测到 Homebrew，开始安装…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # 将 brew 注入当前 shell（Apple Silicon 默认前缀 /opt/homebrew）
  if [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
  if [ -x /usr/local/bin/brew ];  then eval "$(/usr/local/bin/brew shellenv)";  fi
else
  say "已检测到 Homebrew: $(brew --version | head -1)"
fi

# 3) Go（需要 1.25+）
need_go_install=1
if command -v go >/dev/null 2>&1; then
  ver="$(go version | awk '{print $3}' | sed 's/^go//')"   # 形如 1.25.0
  minor="$(printf '%s' "$ver" | cut -d. -f2)"
  if [ "${minor:-0}" -ge "$MIN_GO_MINOR" ]; then
    say "已检测到 Go: $ver（满足 >=1.$MIN_GO_MINOR）"
    need_go_install=0
  else
    warn "当前 Go 版本 $ver 偏低，需 >=1.$MIN_GO_MINOR，尝试用 Homebrew 升级…"
  fi
fi
if [ "$need_go_install" -eq 1 ]; then
  say "通过 Homebrew 安装/升级 Go…"
  brew install go || brew upgrade go
fi

command -v go >/dev/null 2>&1 || die "Go 安装失败，请手动安装后重试: https://go.dev/dl/"

# 4) 依赖与编译
say "拉取依赖…"
go mod download
say "编译 $BIN_NAME（本机架构）…"
go build -o "$BIN_NAME" "$ENTRY"

say "完成 ✅  现在可以运行: ./start.sh"
say "（自定义地址: SKILLBOOK_ADDR=127.0.0.1:8080 ./start.sh）"
