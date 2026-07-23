# MemoBox IPC 契约

> 契约版本：V003
> 最后更新：2026-07-23
> 生效任务：T02～T07 本地数据、笔记、图片、回收站、分类与标签闭环

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
| `schemaVersion` | number    | 最后成功执行的 Migration 版本；当前 V002 为 `2`     |

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

## 4. 笔记接口

所有笔记接口只作用于未删除笔记。Command 在阻塞线程执行，前端不得传入数据库路径、分类路径或排序 SQL。

### `create_note`

无参数。创建一条空白笔记并返回完整详情；新建成功后前端立即聚焦标题输入框。

### `list_notes`

无参数。按 `is_pinned DESC, updated_at DESC, id DESC` 返回未删除笔记的 `NoteSummary[]`。

| 字段             | 类型   | 说明                                   |
| ---------------- | ------ | -------------------------------------- |
| `id`             | string | 笔记 UUID                              |
| `title`          | string | 原始标题；空标题由前端展示层回退       |
| `contentPreview` | string | 正文归一化后的前 160 个字符，不含 HTML |
| `createdAt`      | string | UTC RFC 3339                           |
| `updatedAt`      | string | UTC RFC 3339                           |

### `get_note`

请求：`{ id: string }`。成功返回 `NoteDetail`：`id`、`title`、`content`、`createdAt`、`updatedAt`。不存在或已删除时返回 `NOTE_NOT_FOUND`。

### `save_note`

请求：`{ id: string, title: string, content: string }`。在一个数据库事务内更新标题、正文和 `updated_at`，成功返回更新后的 `NoteDetail`。标题与正文最大长度由 Rust 限制，前端不可绕过。

### `cleanup_empty_note`

请求：`{ id: string }`。仅当笔记标题和正文均为空白、没有关联资源且未删除时删除临时笔记；其他情况保持幂等且不修改数据。前端在切换笔记前调用。

### `save_recovery_draft`

请求：`{ id: string, title: string, content: string, failureCode: string }`。仅在正常保存失败后调用，以 UPSERT 方式写入 `recovery_drafts`；失败不会覆盖前端内存草稿。该接口不记录正文到日志。

### 笔记错误码

`NOTE_NOT_FOUND` ｜ `NOTE_VALIDATION_FAILED` ｜ `NOTE_LIST_FAILED` ｜ `NOTE_SAVE_FAILED` ｜ `RECOVERY_DRAFT_SAVE_FAILED`

## 5. 图片资源接口

### `save_pasted_image`

请求：`{ noteId: string, bytes: number[] }`。前端只能在编辑器的用户粘贴事件中读取剪贴板文件或系统位图后调用，不传入文件路径、扩展名、MIME 或哈希。

Rust 必须根据字节文件头识别 PNG、JPEG、WebP 或 GIF，并以受限内存和尺寸的完整解码校验可读性和尺寸；不信任前端类型。原始文件字节可用时直接保存；只有系统仅提供 RGBA 位图时，前端无损编码为 PNG 再请求本接口。服务端以 SHA-256 去重、临时文件加同步和原子移动写入 `assets/{asset-id}.{extension}`，再以事务创建或复用资源记录和笔记关联。任一步失败时不插入 Markdown，也不保留临时或孤立文件。

成功响应：`SavedAsset`。

| 字段           | 类型   | 说明                                                 |
| -------------- | ------ | ---------------------------------------------------- |
| `id`           | string | 稳定资源 UUID                                        |
| `relativePath` | string | 固定为 `assets/{asset-id}.{extension}`，不含绝对路径 |
| `mimeType`     | string | 由 Rust 检测出的真实类型                             |
| `width`        | number | 图片宽度                                             |
| `height`       | number | 图片高度                                             |
| `size`         | number | 实际字节数                                           |

前端使用返回值插入 `![图片](./assets/{asset-id}.{extension})`，随后触发自动保存。文件达到或超过 10 MiB 时，必须在调用前显示实际大小并允许用户继续或取消；取消时不得调用原生接口。

### `get_note_asset_health`

请求：`{ noteId: string }`。返回 `AssetHealth { missingAssetCount: number }`。仅返回缺失数量，不向前端公开文件系统路径；大于零时编辑区显示资源缺失提示，原 Markdown 引用保持不变。

### 图片错误码

`ASSET_NOTE_NOT_FOUND` ｜ `INVALID_IMAGE_DATA` ｜ `UNSUPPORTED_IMAGE_FORMAT` ｜ `IMAGE_DIMENSIONS_INVALID` ｜ `ASSET_STORAGE_UNAVAILABLE` ｜ `ASSET_WRITE_FAILED` ｜ `ASSET_SAVE_FAILED`

## 6. 回收站接口

### `trash_note`、`list_trashed_notes`、`restore_note`

- `trash_note` 请求：`{ id: string }`，成功返回空值。删除前由前端 flush 当前草稿；普通删除只进入回收站。
- `list_trashed_notes` 无参数，返回 `TrashedNoteSummary[]`：`id`、`title`、`contentPreview`、`deletedAt`、`trashedFromCategoryPath`。
- `restore_note` 请求：`{ id: string }`，成功返回恢复后的 `NoteDetail`。原分类不存在时返回未分类，前端依据 `restoredToUncategorized` 显示提示。

### `permanently_delete_note`、`empty_trash`

- `permanently_delete_note` 请求：`{ id: string }`；`empty_trash` 无参数。两者均在前端二次确认后调用，成功返回 `TrashCleanupResult { deletedNoteCount, pendingFileCleanupCount }`。
- 文件清理失败不会撤销已完成的永久删除；`pendingFileCleanupCount` 大于零时前端显示可安全重试的提示，不暴露路径。

### 回收站错误码

`TRASH_NOTE_NOT_FOUND` ｜ `TRASH_OPERATION_FAILED`

## 7. 分类接口

`list_categories` 返回嵌套 `CategoryNode[]`（含 `path`、`noteCount`、`children`）；`create_category` 请求 `{ name, parentId? }`；`rename_category` 请求 `{ id, name }`；`move_category` 请求 `{ id, parentId?, orderedIds }`；`get_category_delete_impact` 请求 `{ id }`；`delete_category` 请求 `{ id, mode: 'current' | 'branch' }`。分类筛选通过 `list_notes_by_category` 请求 `{ categoryId? }`，省略 `categoryId` 表示未分类。

分类 Command 不接收层级、路径或 SQL。错误码：`CATEGORY_NOT_FOUND` ｜ `CATEGORY_VALIDATION_FAILED` ｜ `CATEGORY_DUPLICATE_NAME` ｜ `CATEGORY_MAX_DEPTH_EXCEEDED` ｜ `CATEGORY_CYCLE_DETECTED` ｜ `CATEGORY_OPERATION_FAILED`。

## 8. 标签接口

`list_tags` 返回 `TagSummary[]`；`create_tag` 请求 `{ name }`；`rename_tag` 请求 `{ id, name }`，当目标名称已存在时返回 `TagMergePreview`；`merge_tag` 请求 `{ sourceId, targetId }`；`delete_tag` 请求 `{ id }`；`set_note_tags` 请求 `{ noteId, tagIds }`；`list_notes_by_tags` 请求 `{ tagIds }`。服务端忽略重复标签 ID，仅执行 AND 筛选。

标签错误码：`TAG_NOT_FOUND` ｜ `TAG_VALIDATION_FAILED` ｜ `TAG_DUPLICATE_NAME` ｜ `TAG_OPERATION_FAILED`。

## 9. 关闭与保存行为

前端自动保存防抖为 1 秒；连续输入期间不得每键调用 `save_note`。切换笔记、立即保存快捷键和窗口关闭请求前必须执行当前笔记的串行 flush。保存失败时保留内存草稿，尝试写入 `recovery_drafts`，并阻止窗口关闭、展示重试入口；不得静默丢弃内容。
