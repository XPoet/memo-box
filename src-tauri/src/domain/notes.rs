use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteSummary {
    pub id: String,
    pub title: String,
    pub content_preview: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteDetail {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category_id: Option<String>,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Error)]
pub enum NoteError {
    #[error("笔记不存在或已删除。")]
    NotFound,
    #[error("笔记内容不符合保存要求。")]
    ValidationFailed,
    #[error("无法读取笔记列表。")]
    ListFailed,
    #[error("无法保存笔记。")]
    SaveFailed,
    #[error("无法保存恢复草稿。")]
    RecoveryDraftSaveFailed,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<NoteError> for NoteCommandError {
    fn from(error: NoteError) -> Self {
        let (code, message) = match error {
            NoteError::NotFound => ("NOTE_NOT_FOUND", "笔记不存在或已删除。"),
            NoteError::ValidationFailed => ("NOTE_VALIDATION_FAILED", "笔记内容不符合保存要求。"),
            NoteError::ListFailed => ("NOTE_LIST_FAILED", "无法读取笔记列表，请稍后重试。"),
            NoteError::SaveFailed => (
                "NOTE_SAVE_FAILED",
                "笔记保存失败，当前内容仍保留在编辑器中。",
            ),
            NoteError::RecoveryDraftSaveFailed => (
                "RECOVERY_DRAFT_SAVE_FAILED",
                "笔记保存失败，且恢复草稿暂时无法写入。",
            ),
        };
        Self { code, message }
    }
}
