# MemoBox 数据库契约

> 契约版本：V002
> 最后更新：2026-07-23
> 生效任务：T02 本地数据目录、数据库迁移与启动闭环；T03 笔记工作台、纯文本编辑与自动保存闭环；T04 图片粘贴与本地资源生命周期

## 1. 存储位置与连接约束

- 数据库固定存放在 Tauri 系统应用数据目录的 `database/memobox.db`；前端不得传入或读取该路径。
- 启动连接必须启用 `foreign_keys = ON`、`journal_mode = WAL`、`synchronous = NORMAL` 和 `busy_timeout = 5000`。
- 所有结构变更必须新增只增不改的 `src-tauri/migrations/VNNN__*.sql`；单个迁移与迁移记录写入同一事务。
- 迁移执行失败时，应用进入诊断状态，不得继续正常业务。

## 2. Migration 记录

`schema_migrations` 记录已成功执行的迁移。

| 字段         | 类型    | 约束         | 说明                         |
| ------------ | ------- | ------------ | ---------------------------- |
| `version`    | INTEGER | 主键、正整数 | Migration 版本号，例如 `1`   |
| `name`       | TEXT    | 非空、唯一   | Migration 文件名，不含扩展名 |
| `applied_at` | TEXT    | 非空         | UTC Unix 时间戳（秒）        |

应用仅接受连续的 `V001` 格式 Migration；发现重复版本、版本断档、名称不匹配或 SQL 执行错误时停止启动。

## 3. V001 核心表

### 3.1 `notes`

| 字段                         | 类型    | 约束                                         |
| ---------------------------- | ------- | -------------------------------------------- |
| `id`                         | TEXT    | 主键                                         |
| `title`                      | TEXT    | 非空，默认空字符串                           |
| `content`                    | TEXT    | 非空，默认空字符串                           |
| `category_id`                | TEXT    | 可空，外键到 `categories.id`，删除分类时置空 |
| `is_pinned`                  | INTEGER | 非空，取值 0 或 1，默认 0                    |
| `is_deleted`                 | INTEGER | 非空，取值 0 或 1，默认 0                    |
| `trashed_from_category_id`   | TEXT    | 可空，供分类分支删除后的恢复使用             |
| `trashed_from_category_path` | TEXT    | 可空，供回收站展示使用                       |
| `created_at`                 | TEXT    | 非空，UTC RFC 3339                           |
| `updated_at`                 | TEXT    | 非空，UTC RFC 3339                           |
| `deleted_at`                 | TEXT    | 可空，UTC RFC 3339                           |

### 3.2 `categories`

| 字段         | 类型    | 约束                                         |
| ------------ | ------- | -------------------------------------------- |
| `id`         | TEXT    | 主键                                         |
| `name`       | TEXT    | 非空                                         |
| `parent_id`  | TEXT    | 可空，外键到 `categories.id`，删除父节点受限 |
| `level`      | INTEGER | 非空，取值 1 至 5                            |
| `sort_order` | INTEGER | 非空，默认 0                                 |
| `created_at` | TEXT    | 非空，UTC RFC 3339                           |
| `updated_at` | TEXT    | 非空，UTC RFC 3339                           |

同一父级下名称唯一：根节点使用部分唯一索引，子节点使用 `(parent_id, name)` 唯一索引。层级、循环和跨树移动等业务校验由后续 Category Service 在事务中完成。

### 3.3 `tags` 与 `note_tags`

`tags.name` 全局唯一；`note_tags` 使用 `(note_id, tag_id)` 复合主键，关联删除时级联清理。

| 表          | 关键字段                                 |
| ----------- | ---------------------------------------- |
| `tags`      | `id`、`name`、`created_at`、`updated_at` |
| `note_tags` | `note_id`、`tag_id`、`created_at`        |

### 3.4 `assets` 与 `note_assets`

资源由内容哈希唯一约束识别，物理文件仅存相对路径。为了同时支持资源去重和多笔记共享，`assets` 不保存 `note_id`，关联由 `note_assets` 表维护。

| 表            | 关键字段                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `assets`      | `id`、`file_name`、`original_name`、`extension`、`relative_path`、`mime_type`、`size`、`width`、`height`、`hash`、`created_at` |
| `note_assets` | `note_id`、`asset_id`、`created_at`                                                                                            |

`extension`、`relative_path`、`mime_type`、`size` 和图片尺寸必须由 Rust 基于真实文件内容校验后写入；后续资源服务以 `note_assets` 引用计数决定是否可以清理物理文件。

### 3.5 `app_settings` 与 `recovery_drafts`

| 表                | 关键字段                                                                  | 说明                                   |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| `app_settings`    | `key`、`value`、`updated_at`                                              | 设置值由后续设置服务定义和校验         |
| `recovery_drafts` | `note_id`、`title`、`content`、`failure_code`、`created_at`、`updated_at` | 自动保存持续失败时保存可恢复草稿元数据 |

## 4. 索引与后续演进

- V001 为外键过滤、笔记列表、分类排序和资源引用计数建立基础索引。
- 搜索全文索引不在 V001 建立，由 T08 通过新 Migration 引入；不得修改 V001。
- 每项新增字段、索引或约束必须先更新本文档，再新增对应 Migration、Repository 测试和调用方。

## 5. T03／T04 数据写入规则

### 5.1 笔记与恢复草稿

- 创建笔记时以 UUID、空标题和空正文插入 `notes`，`created_at` 与 `updated_at` 均使用 UTC RFC 3339。
- 普通保存必须在一个事务内更新 `title`、`content` 和 `updated_at`；标题和正文最大长度由 Rust Service 校验，避免异常大请求耗尽内存。
- 完全空白且没有 `note_assets` 关联的临时笔记可在离开时删除；非空笔记、含资源笔记和已删除笔记不得被该清理逻辑删除。
- 正常保存失败后，`recovery_drafts` 以 `note_id` 为主键 UPSERT 标题、正文、失败码和时间；恢复草稿不是历史版本，也不替代前端内存草稿。

### 5.2 资源文件与关联

- 文件固定写入应用数据目录内的 `assets/{asset-id}.{extension}`；`relative_path` 只保存该相对路径，禁止保存绝对路径或前端提供的路径。
- 服务端根据文件头识别 PNG、JPEG、WebP、GIF，并以受限内存和尺寸的完整解码验证可读性；`extension`、`mime_type`、`size`、`width`、`height` 必须与实际字节一致。
- 服务端先计算 SHA-256。哈希已存在时仅在事务中幂等插入 `note_assets`；哈希不存在时先写入 `temp/` 临时文件、`sync_all`、原子移动到 `assets/`，再在事务内插入 `assets` 与 `note_assets`。
- 资源记录或关联事务失败时，服务端必须删除本次新建的最终文件；临时文件失败时也必须清理。后续 T05 负责永久删除后的引用计数垃圾回收。
- 图片文件不存在时不得删除或改写 Markdown；健康检查仅返回缺失数量，避免暴露应用数据目录。

### 5.3 大图片决策 D01

T04 将“文件过大”明确为实际字节数达到或超过 10 MiB。此前端交互门槛只要求显示文件大小并允许用户取消，不进行压缩、转码、尺寸调整或静默拒绝；用户确认后仍由后端执行完整格式和安全校验。
