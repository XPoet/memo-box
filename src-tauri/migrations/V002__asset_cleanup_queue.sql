CREATE TABLE asset_cleanup_queue (
  relative_path TEXT PRIMARY KEY,
  queued_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT
);
