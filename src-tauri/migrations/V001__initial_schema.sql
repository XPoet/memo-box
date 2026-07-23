CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY CHECK (version > 0),
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES categories (id) ON DELETE RESTRICT,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX categories_root_name_unique ON categories (name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX categories_child_name_unique ON categories (parent_id, name) WHERE parent_id IS NOT NULL;
CREATE INDEX categories_parent_sort_index ON categories (parent_id, sort_order, id);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category_id TEXT REFERENCES categories (id) ON DELETE SET NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  trashed_from_category_id TEXT,
  trashed_from_category_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX notes_active_list_index ON notes (is_deleted, is_pinned DESC, updated_at DESC, id);
CREATE INDEX notes_category_list_index ON notes (category_id, is_deleted, updated_at DESC, id);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE note_tags (
  note_id TEXT NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX note_tags_tag_note_index ON note_tags (tag_id, note_id);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT,
  extension TEXT NOT NULL,
  relative_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE note_assets (
  note_id TEXT NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (note_id, asset_id)
);

CREATE INDEX note_assets_asset_note_index ON note_assets (asset_id, note_id);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recovery_drafts (
  note_id TEXT PRIMARY KEY REFERENCES notes (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  failure_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
