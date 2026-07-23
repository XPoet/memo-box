# MemoBox

MemoBox 是一款本地笔记桌面应用。项目使用 Tauri 2、Vue 3、TypeScript、Rust 和 SQLite 构建。

## 项目特点

- 本地优先：业务数据、图片资源、日志和配置均保存在系统应用数据目录，不依赖网络、CDN 或远程字体。
- 分层架构：`Vue → Service / Pinia → Tauri Command → Rust Service → Repository → SQLite / 文件系统`。
- 安全初始化：启动时创建固定目录，启用 SQLite 外键、WAL、NORMAL synchronous 与 5 秒 busy timeout，并以事务执行 Migration。
- 最小权限：当前 Capability 仅授予主窗口 `core:default`，不开放 Shell、HTTP 或任意文件系统权限。
- 工程质量：使用 Oxfmt、Oxlint、vue-tsc、Vitest、rustfmt、Clippy 与 Cargo Test 进行检查。

## 技术栈

| 范围       | 技术                                                   |
| ---------- | ------------------------------------------------------ |
| 桌面端     | Tauri 2、Rust                                          |
| 前端       | Vue 3、TypeScript、Vite、Vue Router、Pinia             |
| UI 与样式  | Element Plus 按需导入、SCSS                            |
| 编辑器     | CodeMirror 6                                           |
| 本地存储   | SQLite、rusqlite bundled                               |
| 测试与质量 | Vitest、Vue Test Utils、Oxfmt、Oxlint、vue-tsc、Clippy |

## 开发环境

当前工程基线使用 Node.js `25.2.1`、pnpm `10.13.1` 和 Rust `1.96.1`；Rust 最低版本由 `src-tauri/Cargo.toml` 固定为 `1.85`。

在 macOS 上还需要安装 Xcode Command Line Tools，以便编译 Tauri 原生应用：

```bash
xcode-select --install
```

可先确认本地工具链：

```bash
node --version
pnpm --version
rustc --version
cargo --version
```

## 安装依赖

首次克隆或切换到新工作区后，使用锁文件安装依赖：

```bash
pnpm install --frozen-lockfile
```

不要手动修改 `pnpm-lock.yaml` 或 `src-tauri/Cargo.lock`。新增或升级依赖必须先确认现有依赖无法满足需求，并完成完整质量门验证。

## 启动与调试

### 仅调试前端页面

```bash
pnpm dev
```

Vite 会启动在 `http://localhost:1420`。该命令只验证浏览器前端，不会加载 Tauri IPC，也不会初始化实际应用数据目录。

### 调试完整桌面应用

```bash
pnpm tauri:dev
```

该命令会自动启动 Vite，再启动 Tauri 原生窗口。应用启动后会执行本地数据初始化：

1. 通过 Tauri 系统路径 API 获取固定应用数据目录。
2. 创建 `database`、`assets`、`temp`、`logs`、`config` 子目录。
3. 创建或打开 `database/memobox.db`。
4. 应用 V001 Migration，并向前端返回数据目录与结构版本。

初始化失败时，应用显示安全诊断与重试入口；不会把 SQL、数据库绝对路径或笔记内容暴露给界面。

## 常用命令

| 命令                | 用途                                         |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | 仅启动 Vite 前端开发服务器                   |
| `pnpm tauri:dev`    | 启动完整 Tauri 桌面应用                      |
| `pnpm format`       | 格式化前端代码与受管文档                     |
| `pnpm format:check` | 检查前端格式                                 |
| `pnpm lint`         | 使用 Oxlint 进行类型感知检查                 |
| `pnpm typecheck`    | 使用 vue-tsc 检查 TypeScript 与 Vue SFC 类型 |
| `pnpm test`         | 运行 Vitest 测试                             |
| `pnpm build`        | 执行前端类型检查并构建静态资源               |
| `pnpm tauri:build`  | 构建 Tauri 原生发行包                        |
| `pnpm check`        | 运行完整前端与 Rust 质量门                   |

可针对当前启动闭环运行聚焦验证：

```bash
pnpm exec vitest run bootstrap
cargo test --manifest-path src-tauri/Cargo.toml bootstrap
```

## 质量检查

提交前必须执行：

```bash
pnpm check
git diff --check
```

`pnpm check` 会顺序执行：

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## 构建与打包

### 前端构建

```bash
pnpm build
```

构建产物位于 `dist/`，由 Tauri 的 `beforeBuildCommand` 自动调用，无需在原生构建前单独执行。

### 当前平台 Debug 构建

```bash
pnpm exec tauri build --debug
```

该命令用于开发阶段验证当前平台的原生编译和打包链路。

### 发行构建

```bash
pnpm tauri:build
```

构建配置会先运行 `pnpm build`，再生成当前平台的 Tauri 发行产物。正式发布前仍需完成签名、公证、安装验收和版本核对；这些发布操作不应自动执行。

## 目录说明

```text
src/                 Vue 页面、布局、状态、服务与样式
src-tauri/src/       Tauri Command、Rust Service、Repository 与数据库代码
src-tauri/migrations/ 只增不改的 SQLite Migration
src-tauri/capabilities/ 最小权限配置
docs/                PRD、技术设计、数据库／IPC 契约与开发计划
tests/               前端单元与组件测试
```

## 数据与文档约定

- 数据库结构以 [docs/DATABASE.md](docs/DATABASE.md) 为准；结构变更必须先更新该文档，再新增 Migration。
- Tauri Command 与前后端 DTO 以 [docs/IPC.md](docs/IPC.md) 为准；Vue 组件不得直接调用 `invoke()`。
- 实施顺序、任务状态、风险与验证证据以 [docs/development-plan.md](docs/development-plan.md) 为准。
- 不得通过删除数据库或临时执行 DDL 代替 Migration；已发布 Migration 不得修改。
- 前端不得读取应用数据目录或执行 SQL；数据库和文件系统仅由 Rust 管理。