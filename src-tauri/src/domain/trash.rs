use serde::Serialize;
use thiserror::Error;

use super::notes::NoteDetail;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashedNoteSummary {
    pub id: String,
    pub title: String,
    pub content_preview: String,
    pub deleted_at: String,
    pub trashed_from_category_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreNoteResult {
    pub note: NoteDetail,
    pub restored_to_uncategorized: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashCleanupResult {
    pub deleted_note_count: u32,
    pub pending_file_cleanup_count: u32,
}

#[derive(Debug, Error)]
pub enum TrashError {
    #[error("回收站中的笔记不存在。")]
    NotFound,
    #[error("回收站操作失败。")]
    OperationFailed,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<TrashError> for TrashCommandError {
    fn from(error: TrashError) -> Self {
        let (code, message) = match error {
            TrashError::NotFound => ("TRASH_NOTE_NOT_FOUND", "回收站中的笔记不存在。"),
            TrashError::OperationFailed => {
                ("TRASH_OPERATION_FAILED", "回收站操作失败，请稍后重试。")
            }
        };
        Self { code, message }
    }
}
