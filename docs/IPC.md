# MemoBox IPC 契约

> 契约版本：V001
> 最后更新：2026-07-23
> 生效任务：T02 本地数据目录、数据库迁移与启动闭环

## 1. 通用规则

- Vue 组件只能调用 TypeScript Service；Service 统一封装 Tauri `invoke`。
- Command 仅负责参数反序列化、线程调度和 Service 调用；不得接收前端提供的数据库路径或任意文件路径。
- 失败以稳定错误码返回，前端仅展示安全诊断信息，不显示 SQL、系统绝对路径或笔记内容。

## 2. `bootstrap_app`

### 请求

无参数。

### 成功响应：`BootstrapSnapshot`

| 字段            | 类型      | 说明                                                |
| --------------- | --------- | --------------------------------------------------- |
| `status`        | `'ready'` | 初始化成功时固定为 `ready`                          |
| `dataDirectory` | string    | 经系统路径 API 获取的应用数据目录，仅用于设置页展示 |
| `schemaVersion` | number    | 最后成功执行的 Migration 版本；V001 为 `1`          |

### 失败响应：`BootstrapError`

| 字段      | 类型                                                                                                                                                                             | 说明                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `code`    | `DATA_DIRECTORY_UNAVAILABLE` ｜ `DATA_DIRECTORY_NOT_WRITABLE` ｜ `DATABASE_OPEN_FAILED` ｜ `DATABASE_LOCKED` ｜ `DATABASE_CORRUPTED` ｜ `MIGRATION_FAILED` ｜ `BOOTSTRAP_FAILED` | 稳定错误码                                     |
| `message` | string                                                                                                                                                                           | 面向用户的安全提示，不包含正文、SQL 或内部路径 |

### 行为

1. Command 在阻塞线程执行目录创建、可写性检查、数据库连接和 Migration。
2. 首次启动创建 `database`、`assets`、`temp`、`logs`、`config` 和 `database/memobox.db`。
3. 重复启动幂等执行；已成功执行的 Migration 不重复运行。
4. 任一步失败时前端进入只读诊断页，停止后续写入调用。

## 3. 前端状态

`app` Pinia Store 管理 `idle`、`loading`、`ready`、`failed` 四种启动状态。`ready` 才渲染工作台；`failed` 渲染诊断信息和重试按钮。当前接口不提供修改或迁移数据目录的能力。
