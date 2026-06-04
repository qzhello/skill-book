# SkillBook

本地 Skill 管理台（P1 MVP）：扫描全机 Claude Code skill，浏览/搜索/在线编辑，保存自动本地 git 提交，跨来源同名冲突高亮。

## 一键启动
```bash
./start.sh           # 默认 127.0.0.1:7777，自动开浏览器
SKILLBOOK_ADDR=127.0.0.1:8080 ./start.sh
```

## 来源
- `~/.claude/skills`（用户级）
- `<当前目录>/.claude/skills`（项目级）
- `~/.claude/plugins`（plugin）

## 路线图
P2 配方创建+AI 优化 / P3 导入安装+GitHub 备份 / P4 远程更新+语义检索。详见 `docs/superpowers/specs/`。
