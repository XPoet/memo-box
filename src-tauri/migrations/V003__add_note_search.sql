CREATE VIRTUAL TABLE notes_fts USING fts5 (
  note_id UNINDEXED,
  search_text,
  tokenize = 'unicode61'
);
