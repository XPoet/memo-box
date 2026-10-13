# 项目规则

## 技术栈

- Tauri 2
- Rust
- TypeScript
- Vite
- Vue 3
- Element Plus
- Pinia
- Vue Router
- SCSS
- SQLite + rusqlite
- CodeMirror 6
- Oxfmt
- Oxlint
- vue-tsc
- Vitest + Vue Test Utils

要求：

- 只使用稳定版本。
- 不得擅自升级依赖或修改锁文件。

## 架构边界

必须遵循：

```text
Vue 组件
  ↓
Composable / Pinia
  ↓
TypeScript Service
  ↓
Tauri Command
  ↓
Rust Service
  ↓
Repository
  ↓
SQLite / 文件系统
```

禁止：

- Vue 组件直接调用 `invoke()`。
- Vue 前端直接执行 SQL。
- Vue 前端直接访问应用数据目录。
- Command 层编写复杂业务逻辑或 SQL。
- Repository 层处理界面逻辑或文件系统业务。

## Vue 与样式规则

- 统一使用 Composition API 和 `<script setup lang="ts">`。
- 禁止滥用 `any`、非空断言和类型断言。
- Props、Emits 和 Service 返回值必须有明确类型。
- 页面放在 `src/views/`。
- 通用组件放在 `src/components/`。
- 业务模块放在 `src/features/`。
- Tauri 调用放在 `src/services/`。
- 状态管理放在 `src/stores/`。
- 可复用逻辑放在 `src/composables/`。
- Markdown 编辑器必须使用 CodeMirror 6。
- 基础组件优先使用 Element Plus。
- 全局变量和主题统一放在 `src/styles/`。
- Element Plus 样式覆盖必须集中维护。

## Rust 与 SQLite 规则

- 使用 `Command → Service → Repository` 分层。
- 使用 `Result` 和 `thiserror` 处理错误。
- 正常业务代码禁止使用 `unwrap()` 和 `expect()`。
- SQLite 只能由 Rust 访问。
- 使用 `rusqlite` bundled 模式。
- SQL 必须参数化，数据库写入必须使用事务。
- 文件路径必须规范化并校验允许范围。
- 不信任前端传入的路径、扩展名和 MIME 类型。
- 阻塞操作不得运行在 Tauri 主线程。
- 所有数据库结构变更必须新增 Migration。
- 已发布的 Migration 禁止修改。
- 禁止通过删除数据库或临时执行 DDL 代替迁移。

## 文件与安全

- 应用数据目录必须通过 Tauri 系统路径 API 获取。
- 禁止硬编码用户目录和绝对路径。
- 禁止向前端开放任意文件系统、Shell 或 HTTP 权限。
- Capability 必须遵循最小权限原则。
- 不加载远程页面，不启用远程 IPC。
- 文件写入优先使用临时文件加原子移动。
- 数据库与文件操作无法原子化时，必须提供失败补偿。

## 格式化与代码检查

- 前端代码统一使用 Oxfmt 格式化。
- 前端代码统一使用 Oxlint 检查。
- Vue SFC 和 Template 使用 `vue-tsc` 检查类型。
- Rust 使用 rustfmt 和 Clippy。

修改完成后必须执行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## 修改范围与完成标准

- 只修改完成当前任务必需的文件。
- 优先复用现有组件、类型、Service 和工具函数。
- 新增依赖前必须确认现有依赖无法满足需求。
- 修改公共接口、数据库结构或目录约定时，必须同步修改调用方、测试和文档。
- Tauri 相关修改至少完成当前平台构建验证。