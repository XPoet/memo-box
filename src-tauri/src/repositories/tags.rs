use std::collections::HashSet;

use rusqlite::types::Value;
use rusqlite::{Connection, OptionalExtension, params};

use crate::domain::notes::NoteSummary;
use crate::domain::settings::NoteSort;
use crate::domain::tags::{RenameTagResult, TagError, TagMergePreview, TagSummary};

pub struct TagsRepository;

impl TagsRepository {
    pub fn list(connection: &Connection) -> Result<Vec<TagSummary>, TagError> {
        let mut statement = connection
            .prepare(
                "SELECT tags.id, tags.name, COUNT(note_tags.note_id)
             FROM tags LEFT JOIN note_tags ON note_tags.tag_id = tags.id
             GROUP BY tags.id ORDER BY lower(tags.name), tags.id",
            )
            .map_err(|_| TagError::OperationFailed)?;
        let rows = statement
            .query_map([], tag_from_row)
            .map_err(|_| TagError::OperationFailed)?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|_| TagError::OperationFailed)
    }

    pub fn list_for_note(
        connection: &Connection,
        note_id: &str,
    ) -> Result<Vec<TagSummary>, TagError> {
        let mut statement = connection.prepare(
            "SELECT tags.id, tags.name, 0 FROM tags INNER JOIN note_tags ON note_tags.tag_id = tags.id
             WHERE note_tags.note_id = ?1 ORDER BY lower(tags.name), tags.id",
        ).map_err(|_| TagError::OperationFailed)?;
        let rows = statement
            .query_map(params![note_id], tag_from_row)
            .map_err(|_| TagError::OperationFailed)?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|_| TagError::OperationFailed)
    }

    pub fn create(
        connection: &mut Connection,
        id: &str,
        name: &str,
        now: &str,
    ) -> Result<TagSummary, TagError> {
        let transaction = connection
            .transaction()
            .map_err(|_| TagError::OperationFailed)?;
        ensure_unique(&transaction, name, None)?;
        transaction
            .execute(
                "INSERT INTO tags (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                params![id, name, now],
            )
            .map_err(|_| TagError::DuplicateName)?;
        transaction
            .commit()
            .map_err(|_| TagError::OperationFailed)?;
        find_tag(connection, id)
    }

    pub fn rename(
        connection: &mut Connection,
        id: &str,
        name: &str,
        now: &str,
    ) -> Result<RenameTagResult, TagError> {
        let transaction = connection
            .transaction()
            .map_err(|_| TagError::OperationFailed)?;
        let exists = transaction
            .query_row("SELECT 1 FROM tags WHERE id = ?1", params![id], |_| Ok(()))
            .optional()
            .map_err(|_| TagError::OperationFailed)?
            .is_some();
        if !exists {
            return Err(TagError::NotFound);
        }
        if let Some(target_id) = tag_id_by_name(&transaction, name)? {
            if target_id != id {
                let affected_note_count = transaction
                    .query_row(
                        "SELECT COUNT(*) FROM note_tags WHERE tag_id = ?1",
                        params![id],
                        |row| row.get::<_, u32>(0),
                    )
                    .map_err(|_| TagError::OperationFailed)?;
                return Ok(RenameTagResult {
                    tag: None,
                    merge_preview: Some(TagMergePreview {
                        source_id: id.to_owned(),
                        target_id,
                        affected_note_count,
                    }),
                });
            }
        }
        transaction
            .execute(
                "UPDATE tags SET name = ?2, updated_at = ?3 WHERE id = ?1",
                params![id, name, now],
            )
            .map_err(|_| TagError::OperationFailed)?;
        transaction
            .commit()
            .map_err(|_| TagError::OperationFailed)?;
        Ok(RenameTagResult {
            tag: Some(find_tag(connection, id)?),
            merge_preview: None,
        })
    }

    pub fn merge(
        connection: &mut Connection,
        source_id: &str,
        target_id: &str,
        now: &str,
    ) -> Result<(), TagError> {
        if source_id == target_id {
            return Err(TagError::ValidationFailed);
        }
        let transaction = connection
            .transaction()
            .map_err(|_| TagError::OperationFailed)?;
        let source_exists = transaction
            .query_row(
                "SELECT 1 FROM tags WHERE id = ?1",
                params![source_id],
                |_| Ok(()),
            )
            .optional()
            .map_err(|_| TagError::OperationFailed)?
            .is_some();
        let target_exists = transaction
            .query_row(
                "SELECT 1 FROM tags WHERE id = ?1",
                params![target_id],
                |_| Ok(()),
            )
            .optional()
            .map_err(|_| TagError::OperationFailed)?
            .is_some();
        if !source_exists || !target_exists {
            return Err(TagError::NotFound);
        }
        transaction.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id, created_at) SELECT note_id, ?2, ?3 FROM note_tags WHERE tag_id = ?1", params![source_id, target_id, now]).map_err(|_| TagError::OperationFailed)?;
        transaction
            .execute("DELETE FROM tags WHERE id = ?1", params![source_id])
            .map_err(|_| TagError::OperationFailed)?;
        transaction.commit().map_err(|_| TagError::OperationFailed)
    }

    pub fn delete(connection: &mut Connection, id: &str) -> Result<(), TagError> {
        let changed = connection
            .execute("DELETE FROM tags WHERE id = ?1", params![id])
            .map_err(|_| TagError::OperationFailed)?;
        if changed == 0 {
            return Err(TagError::NotFound);
        }
        Ok(())
    }

    pub fn set_note_tags(
        connection: &mut Connection,
        note_id: &str,
        tag_ids: &[String],
        now: &str,
    ) -> Result<(), TagError> {
        let unique: HashSet<&String> = tag_ids.iter().collect();
        let transaction = connection
            .transaction()
            .map_err(|_| TagError::OperationFailed)?;
        let note_exists = transaction
            .query_row(
                "SELECT 1 FROM notes WHERE id = ?1 AND is_deleted = 0",
                params![note_id],
                |_| Ok(()),
            )
            .optional()
            .map_err(|_| TagError::OperationFailed)?
            .is_some();
        if !note_exists {
            return Err(TagError::NotFound);
        }
        for tag_id in &unique {
            let exists = transaction
                .query_row("SELECT 1 FROM tags WHERE id = ?1", params![tag_id], |_| {
                    Ok(())
                })
                .optional()
                .map_err(|_| TagError::OperationFailed)?
                .is_some();
            if !exists {
                return Err(TagError::NotFound);
            }
        }
        transaction
            .execute("DELETE FROM note_tags WHERE note_id = ?1", params![note_id])
            .map_err(|_| TagError::OperationFailed)?;
        for tag_id in unique {
            transaction
                .execute(
                    "INSERT INTO note_tags (note_id, tag_id, created_at) VALUES (?1, ?2, ?3)",
                    params![note_id, tag_id, now],
                )
                .map_err(|_| TagError::OperationFailed)?;
        }
        transaction.commit().map_err(|_| TagError::OperationFailed)
    }

    pub fn notes_by_tags(
        connection: &Connection,
        tag_ids: &[String],
        note_sort: NoteSort,
    ) -> Result<Vec<NoteSummary>, TagError> {
        if tag_ids.is_empty() {
            return Ok(Vec::new());
        }
        let unique: HashSet<&String> = tag_ids.iter().collect();
        let placeholders = (0..unique.len())
            .map(|index| format!("?{}", index + 1))
            .collect::<Vec<_>>()
            .join(", ");
        let sql = format!(
            "SELECT notes.id, notes.title, notes.content, notes.created_at, notes.updated_at FROM notes JOIN note_tags ON note_tags.note_id = notes.id WHERE notes.is_deleted = 0 AND note_tags.tag_id IN ({placeholders}) GROUP BY notes.id HAVING COUNT(DISTINCT note_tags.tag_id) = ?{} ORDER BY notes.is_pinned DESC, {}",
            unique.len() + 1,
            note_sort.order_by_sql()
        );
        let mut selected_tag_ids = unique.iter().map(|id| (*id).clone()).collect::<Vec<_>>();
        selected_tag_ids.sort_unstable();
        let count = i64::try_from(selected_tag_ids.len()).map_err(|_| TagError::OperationFailed)?;
        let mut values = selected_tag_ids
            .into_iter()
            .map(Value::Text)
            .collect::<Vec<_>>();
        values.push(Value::Integer(count));
        let mut statement = connection
            .prepare(&sql)
            .map_err(|_| TagError::OperationFailed)?;
        let rows = statement
            .query_map(rusqlite::params_from_iter(values.iter()), |row| {
                let content: String = row.get(2)?;
                Ok(NoteSummary {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content_preview: content_preview(&content),
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })
            .map_err(|_| TagError::OperationFailed)?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|_| TagError::OperationFailed)
    }
}

fn tag_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TagSummary> {
    Ok(TagSummary {
        id: row.get(0)?,
        name: row.get(1)?,
        note_count: row.get(2)?,
    })
}
fn find_tag(connection: &Connection, id: &str) -> Result<TagSummary, TagError> {
    connection.query_row("SELECT tags.id, tags.name, COUNT(note_tags.note_id) FROM tags LEFT JOIN note_tags ON note_tags.tag_id = tags.id WHERE tags.id = ?1 GROUP BY tags.id", params![id], tag_from_row).optional().map_err(|_| TagError::OperationFailed)?.ok_or(TagError::NotFound)
}
fn tag_id_by_name(
    connection: &rusqlite::Transaction<'_>,
    name: &str,
) -> Result<Option<String>, TagError> {
    connection
        .query_row(
            "SELECT id FROM tags WHERE lower(name) = lower(?1)",
            params![name],
            |row| row.get(0),
        )
        .optional()
        .map_err(|_| TagError::OperationFailed)
}
fn ensure_unique(
    connection: &rusqlite::Transaction<'_>,
    name: &str,
    excluded_id: Option<&str>,
) -> Result<(), TagError> {
    let existing = connection
        .query_row(
            "SELECT 1 FROM tags WHERE lower(name) = lower(?1) AND (?2 IS NULL OR id != ?2)",
            params![name, excluded_id],
            |_| Ok(()),
        )
        .optional()
        .map_err(|_| TagError::OperationFailed)?
        .is_some();
    if existing {
        Err(TagError::DuplicateName)
    } else {
        Ok(())
    }
}
fn content_preview(content: &str) -> String {
    content
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(160)
        .collect()
}
