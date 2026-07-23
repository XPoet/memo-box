use std::path::{Path, PathBuf};

use time::{OffsetDateTime, format_description::well_known::Rfc3339};
use uuid::Uuid;

use crate::database::connection::open_database;
use crate::domain::notes::{NoteDetail, NoteError, NoteSummary};
use crate::repositories::notes::NotesRepository;

const MAX_TITLE_LENGTH: usize = 4_000;
const MAX_CONTENT_LENGTH: usize = 4_000_000;

pub struct NotesService {
    database_path: PathBuf,
}

impl NotesService {
    pub fn new(data_directory: &Path) -> Self {
        Self {
            database_path: data_directory.join("database").join("memobox.db"),
        }
    }

    pub fn create(&self) -> Result<NoteDetail, NoteError> {
        let mut connection =
            open_database(&self.database_path).map_err(|_| NoteError::SaveFailed)?;
        NotesRepository::create(
            &mut connection,
            &Uuid::new_v4().to_string(),
            &current_time()?,
        )
    }

    pub fn list(&self) -> Result<Vec<NoteSummary>, NoteError> {
        let connection = open_database(&self.database_path).map_err(|_| NoteError::ListFailed)?;
        NotesRepository::list(&connection)
    }

    pub fn get(&self, id: &str) -> Result<NoteDetail, NoteError> {
        let connection = open_database(&self.database_path).map_err(|_| NoteError::SaveFailed)?;
        NotesRepository::find_detail(&connection, id)
    }

    pub fn save(&self, id: &str, title: &str, content: &str) -> Result<NoteDetail, NoteError> {
        validate_note(title, content)?;
        let mut connection =
            open_database(&self.database_path).map_err(|_| NoteError::SaveFailed)?;
        NotesRepository::save(&mut connection, id, title, content, &current_time()?)
    }

    pub fn cleanup_empty(&self, id: &str) -> Result<(), NoteError> {
        let mut connection =
            open_database(&self.database_path).map_err(|_| NoteError::SaveFailed)?;
        NotesRepository::cleanup_empty(&mut connection, id)
    }

    pub fn save_recovery_draft(
        &self,
        id: &str,
        title: &str,
        content: &str,
        failure_code: &str,
    ) -> Result<(), NoteError> {
        validate_note(title, content)?;
        let mut connection =
            open_database(&self.database_path).map_err(|_| NoteError::RecoveryDraftSaveFailed)?;
        NotesRepository::save_recovery_draft(
            &mut connection,
            id,
            title,
            content,
            failure_code,
            &current_time()?,
        )
    }
}

fn validate_note(title: &str, content: &str) -> Result<(), NoteError> {
    if title.chars().count() > MAX_TITLE_LENGTH || content.chars().count() > MAX_CONTENT_LENGTH {
        return Err(NoteError::ValidationFailed);
    }
    Ok(())
}

fn current_time() -> Result<String, NoteError> {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|_| NoteError::SaveFailed)
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::repositories::bootstrap::BootstrapRepository;

    use super::NotesService;

    fn data_directory() -> std::path::PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |duration| duration.as_nanos());
        let root = std::env::temp_dir().join(format!("memo-box-notes-{timestamp}"));
        let _ = std::fs::create_dir_all(root.join("database"));
        root
    }

    #[test]
    fn creates_saves_lists_and_cleans_up_empty_notes() -> Result<(), Box<dyn std::error::Error>> {
        let data_directory = data_directory();
        BootstrapRepository::initialize(&data_directory.join("database").join("memobox.db"))?;
        let service = NotesService::new(&data_directory);

        let note = service.create()?;
        assert_eq!(service.list()?.len(), 1);
        service.cleanup_empty(&note.id)?;
        assert!(service.list()?.is_empty());

        let note = service.create()?;
        let saved = service.save(&note.id, "标题", "正文")?;
        assert_eq!(saved.content, "正文");
        assert_eq!(service.list()?[0].content_preview, "正文");
        service.cleanup_empty(&note.id)?;
        assert_eq!(service.list()?.len(), 1);
        Ok(())
    }
}
