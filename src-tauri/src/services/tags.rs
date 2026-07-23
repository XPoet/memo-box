use std::path::{Path, PathBuf};

use time::{OffsetDateTime, format_description::well_known::Rfc3339};
use uuid::Uuid;

use crate::database::connection::open_database;
use crate::domain::notes::NoteSummary;
use crate::domain::tags::{RenameTagResult, TagError, TagSummary};
use crate::repositories::tags::TagsRepository;

pub struct TagsService {
    database_path: PathBuf,
}
impl TagsService {
    pub fn new(data_directory: &Path) -> Self {
        Self {
            database_path: data_directory.join("database").join("memobox.db"),
        }
    }
    pub fn list(&self) -> Result<Vec<TagSummary>, TagError> {
        let connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::list(&connection)
    }
    pub fn list_for_note(&self, note_id: &str) -> Result<Vec<TagSummary>, TagError> {
        let connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::list_for_note(&connection, note_id)
    }
    pub fn create(&self, name: &str) -> Result<TagSummary, TagError> {
        let name = normalized_name(name)?;
        let mut connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::create(
            &mut connection,
            &Uuid::new_v4().to_string(),
            &name,
            &current_time()?,
        )
    }
    pub fn rename(&self, id: &str, name: &str) -> Result<RenameTagResult, TagError> {
        let name = normalized_name(name)?;
        let mut connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::rename(&mut connection, id, &name, &current_time()?)
    }
    pub fn merge(&self, source_id: &str, target_id: &str) -> Result<(), TagError> {
        let mut connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::merge(&mut connection, source_id, target_id, &current_time()?)
    }
    pub fn delete(&self, id: &str) -> Result<(), TagError> {
        let mut connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::delete(&mut connection, id)
    }
    pub fn set_note_tags(&self, note_id: &str, tag_ids: &[String]) -> Result<(), TagError> {
        let mut connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::set_note_tags(&mut connection, note_id, tag_ids, &current_time()?)
    }
    pub fn notes_by_tags(&self, tag_ids: &[String]) -> Result<Vec<NoteSummary>, TagError> {
        let connection =
            open_database(&self.database_path).map_err(|_| TagError::OperationFailed)?;
        TagsRepository::notes_by_tags(&connection, tag_ids)
    }
}
fn normalized_name(value: &str) -> Result<String, TagError> {
    let name = value.trim();
    if name.is_empty() || name.chars().count() > 80 {
        Err(TagError::ValidationFailed)
    } else {
        Ok(name.to_owned())
    }
}
fn current_time() -> Result<String, TagError> {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|_| TagError::OperationFailed)
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::repositories::bootstrap::BootstrapRepository;
    use crate::services::notes::NotesService;

    use super::TagsService;

    fn data_directory() -> std::path::PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |value| value.as_nanos());
        let directory = std::env::temp_dir().join(format!("memo-box-tags-{timestamp}"));
        let _ = std::fs::create_dir_all(directory.join("database"));
        directory
    }

    #[test]
    fn trims_deduplicates_and_filters_tags_with_and_logic() -> Result<(), Box<dyn std::error::Error>>
    {
        let directory = data_directory();
        BootstrapRepository::initialize(&directory.join("database").join("memobox.db"))?;
        let notes = NotesService::new(&directory);
        let first = notes.create()?;
        let second = notes.create()?;
        let tags = TagsService::new(&directory);
        let urgent = tags.create(" 紧急 ")?;
        let work = tags.create("工作")?;
        tags.set_note_tags(
            &first.id,
            &[urgent.id.clone(), work.id.clone(), work.id.clone()],
        )?;
        tags.set_note_tags(&second.id, std::slice::from_ref(&urgent.id))?;
        assert_eq!(tags.list_for_note(&first.id)?.len(), 2);
        assert_eq!(tags.notes_by_tags(&[urgent.id, work.id])?.len(), 1);
        Ok(())
    }
}
