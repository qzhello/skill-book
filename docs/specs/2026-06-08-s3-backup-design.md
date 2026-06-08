# SkillBook S3 备份设计

- 日期：2026-06-08
- 状态：已批准（待实现）
- 取代：现有 `internal/backup` 的 GitHub git 镜像备份实现

## 1. 目标与背景

当前备份功能把用户级 `~/.<工具>/skills` 目录**明文整目录镜像**进一个本地 git 仓库，再 `push` 到 GitHub。本设计将其**整体替换**为 **S3 归档备份**：

- 备份目标**只支持 S3**（含兼容 S3 协议的服务：Cloudflare R2 / MinIO / 阿里云 OSS 等），移除 GitHub git 备份。
- 每次备份打包成**带时间戳的 `tar.gz` 压缩归档**，作为一个 S3 对象上传。
- 保留**可配置个数**的历史归档（默认 20），超出自动清理最旧的。
- 支持**查看备份历史列表**，并可**恢复任意历史版本**。

### 非目标（YAGNI）

- 不做 GitHub 备份（已明确移除）。
- 不做增量/去重备份（每次全量打包，归档体积小，简单可靠）。
- 不备份标签、来源链接、token 等元数据（仍只备份 skills 文件本身；与现状一致）。
- 不备份"扫描目录/项目目录"（extra dirs），仅备份用户级 `~/.<工具>/skills`（与现状一致）。

## 2. 备份范围

沿用现状：用户级各平台目录 `~/.<工具>/skills`，平台由 `scanner.DiscoverPlatformIDs(home)` 自动发现（claude / codex …），发现不到时回退 `~/.claude/skills`。

打包进 `tar.gz`，内部保留子目录结构：

```
skillbook-20260608-153000.tar.gz
├── manifest.json          # 备份元信息
├── claude/                # 来自 ~/.claude/skills
│   └── ...
└── codex/                 # 来自 ~/.codex/skills
    └── ...
```

`manifest.json` 内容：

```json
{
  "version": 1,
  "createdAt": "2026-06-08T15:30:00Z",
  "platforms": [
    { "id": "claude", "files": 42 },
    { "id": "codex",  "files": 7 }
  ],
  "totalFiles": 49
}
```

打包规则（复用现有 `mirror.go` 的安全约束）：

- 跳过 `.git` 目录。
- 跳过符号链接与特殊文件（只打包普通文件），防越权。
- 普通文件、目录权限正常写入 tar 头。

## 3. 配置

持久化于 `~/.skillbook/backup.json`，权限 **0600**（原子写，复用现有 `Save` 模式）。

```go
type Config struct {
    Endpoint  string `json:"endpoint"`  // 如 s3.amazonaws.com / R2 / MinIO / OSS 地址（不含协议）
    Region    string `json:"region"`    // 如 us-east-1；部分兼容服务可留空
    Bucket    string `json:"bucket"`
    Prefix    string `json:"prefix"`    // key 前缀，默认 "skillbook/"
    AccessKey string `json:"accessKey"`
    SecretKey string `json:"secretKey"` // 仅本机明文存储（0600），GET 永不回显
    UseSSL    bool   `json:"useSSL"`    // 默认 true
    KeepCount int    `json:"keepCount"` // 历史归档保留数，默认 20
}
```

辅助方法：

- `Configured() bool` —— `Endpoint != "" && Bucket != "" && AccessKey != "" && SecretKey != ""`
- `EffectivePrefix() string` —— 空则 `"skillbook/"`，并保证以 `/` 结尾
- `EffectiveKeepCount() int` —— `<=0` 时回落 20

## 4. 归档命名与对象元数据

- 对象 key：`{EffectivePrefix}skillbook-{YYYYMMDD-HHMMSS}.tar.gz`（UTC 时间）
- 时间戳同时是排序键：列表按 key 倒序即按时间倒序。
- 对象 user-metadata：`x-amz-meta-filecount`、`x-amz-meta-created`（用于列表展示，避免为拿文件数下载整个归档）。

## 5. 架构与模块划分

新依赖：`github.com/minio/minio-go/v7`。

### `internal/backup/config.go`（改写）

S3 `Config` 与持久化（替换原 git Config）。

### `internal/backup/archive.go`（新）

- `func packArchive(srcs []SrcDir) ([]byte, Manifest, error)` —— 把若干源目录打包成 `tar.gz` 字节流，返回 manifest。
- `func unpackArchive(data []byte, dsts map[string]string, trashFn func(string)(string,error)) (int, error)` —— 解包恢复；按子目录名映射回各平台目标路径；**zip-slip 防护**：每个 entry 解出的绝对路径必须落在目标根目录内（复用 `withinDir` 思路），否则跳过/报错；跳过符号链接条目；覆盖前对存在的目标目录调 `trashFn`。

### `internal/backup/store.go`（新）

对象存储接口，便于测试注入假实现：

```go
type ArchiveInfo struct {
    Name      string `json:"name"`      // 对象 key 去掉 prefix 后的文件名
    Key       string `json:"-"`         // 完整 key
    Time      int64  `json:"time"`      // 从命名解析或对象 LastModified
    Size      int64  `json:"size"`
    FileCount int    `json:"fileCount"` // 来自 metadata，缺失为 -1
}

type ArchiveStore interface {
    Put(ctx context.Context, key string, data []byte, meta map[string]string) error
    List(ctx context.Context) ([]ArchiveInfo, error)   // 已按时间倒序
    Get(ctx context.Context, key string) ([]byte, error)
    Delete(ctx context.Context, key string) error
    Test(ctx context.Context) error                    // 探测连接/桶可达
}
```

`s3Store` 用 minio-go 实现该接口；构造函数 `newS3Store(cfg Config) (*s3Store, error)`。

### `internal/backup/service.go`（改写）

`Service` 持有 `Srcs []SrcDir`、`storeFn func(Config)(ArchiveStore,error)`（默认 `newS3Store`，测试可注入假 store）。

- `Push(ctx, cfg)`：`packArchive` → `Put` → `List` → 超出 `KeepCount` 的尾部 `Delete`。返回 `{archive 名, fileCount}`。
- `List(ctx, cfg)`：透传 store.List。
- `Restore(ctx, cfg, name, trashFn)`：校验 name 合法（仅文件名、无路径分隔符/`..`）→ `Get` → `unpackArchive` 到各平台目标。
- `Status(ctx, cfg)`：`Configured` + 最近一次归档时间 + 归档数量（来自 List，失败则置零不报错）。

## 6. HTTP API

| 方法 | 路径 | 请求/响应 |
|---|---|---|
| GET  | `/api/backup/config`  | 响应配置，但 `secretKey` 字段替换为 `hasSecret: bool`，绝不回显明文 |
| PUT  | `/api/backup/config`  | 保存配置；`secretKey` 为空字符串时表示"不修改"（沿用已存的原值），非空则更新。不提供单独的"清空 secret"语义——更换凭据即重填一次即可 |
| POST | `/api/backup/test`    | 用当前/提交的配置测试连接，返回 `{ok, error?}` |
| POST | `/api/backup/push`    | 执行备份，返回 `{archive, fileCount, removed}` |
| GET  | `/api/backup/list`    | 返回 `{archives: ArchiveInfo[]}` |
| POST | `/api/backup/restore` | body `{name}`，返回 `{restored: int}` |
| GET  | `/api/backup/status`  | 返回 `{configured, lastBackup, count, scope[]}` |

错误返回沿用项目惯例：`{error: "中文用户友好消息"}`，详细错误记服务端日志，不向前端泄露凭据/内部细节。

## 7. 安全

- `SecretKey` 仅 0600 本地存储；任何 GET 接口只返回 `hasSecret`，永不回显。
- 解包 **zip-slip 防护**：每个 tar entry 目标路径经 `filepath.Clean` 后必须 `withinDir(目标根)`，否则跳过并记日志。
- 跳过符号链接/特殊文件条目（打包与解包两侧）。
- 恢复覆盖前，已存在的平台目录先移废纸篓（复用 `trash.ToTrash`）。
- `restore` 的 `name` 必须是纯文件名（拒绝含 `/`、`\`、`..`）。
- minio client 用 HTTPS（`UseSSL` 默认 true）。

## 8. UI（`web/`）

### 备份设置弹窗

git 字段（repoURL / token / branch）替换为 S3 字段：

- Endpoint、Region、Bucket、Prefix、Access Key、Secret Key（掩码展示，占位提示"已配置则留空表示不修改"）、Keep Count（数字，默认 20）、Use SSL（开关）。
- "测试连接"按钮 → `POST /api/backup/test`，展示成功/失败。
- 保存按钮（沿用"有变动才高亮"模式）。

### 备份列表视图

- 顶部状态：是否已配置、最近备份时间、归档数。
- 列表：每行展示时间、大小、文件数 + "恢复"按钮（二次确认弹窗，说明会先把现有目录移废纸篓）。
- "立即备份"按钮 → `POST /api/backup/push`，完成后刷新列表。

下拉框/滚动条沿用现有自定义样式。

## 9. 测试策略

- `archive_test.go`：打包→解包往返一致；跳过 `.git`/符号链接；**zip-slip 恶意 entry 被拒**。
- `store_test.go`：用假 `ArchiveStore` 验证 List 排序、metadata 解析、缺失 metadata 容错。
- `service_test.go`：注入假 store，验证 Push 后超出 KeepCount 的最旧归档被删除；Restore 选指定版本解包到正确目标且旧目录入废纸篓；name 非法被拒。
- `backup_routes_test.go`：`hasSecret` 不回显；config 留空 secret 保留原值；restore 校验。
- 全部 `go test ./...` 通过；不依赖真实 S3/网络。

## 10. 迁移与兼容

- 旧 `~/.skillbook/backup.json`（git 字段 repoURL/token/branch）与新结构字段名不同，`json.Unmarshal` 会忽略旧字段、新字段取零值 → 表现为"未配置"，用户重新填 S3 配置即可。可在 `Load` 中对旧文件无感处理（无需迁移逻辑）。
- 旧本地工作仓库 `~/.skillbook/backup/`（git 镜像目录）不再使用；实现时一并删除其创建逻辑（已有数据可由用户手动清理，或实现时在首次启动检测到则忽略）。
- 移除 git 相关代码：`mirror.go` 的 git 部分保留可复用的 `withinDir`/`copyTree`（解包恢复仍需要），删除 `Runner`/`authArgs`/`gitEnv`/`ensureRepo`/git push/restore 逻辑。

## 11. 实现顺序（概要）

1. 引入 minio-go 依赖。
2. 改写 `config.go`（S3 Config）。
3. 新增 `archive.go`（pack/unpack + zip-slip 测试）。
4. 新增 `store.go`（接口 + s3Store + 假实现测试）。
5. 改写 `service.go`（Push/List/Restore/Status）。
6. 改写 `backup_routes.go`（7 个接口 + hasSecret）。
7. 改写前端弹窗 + 新增备份列表视图。
8. `go test ./...` + Playwright 验证 UI。
