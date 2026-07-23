use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagSummary {
    pub id: String,
    pub name: String,
    pub note_count: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagMergePreview {
    pub source_id: String,
    pub target_id: String,
    pub affected_note_count: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameTagResult {
    pub tag: Option<TagSummary>,
    pub merge_preview: Option<TagMergePreview>,
}

#[derive(Debug, Error)]
pub enum TagError {
    #[error("标签不存在。")]
    NotFound,
    #[error("标签名称无效。")]
    ValidationFailed,
    #[error("标签名称已存在。")]
    DuplicateName,
    #[error("标签操作失败。")]
    OperationFailed,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<TagError> for TagCommandError {
    fn from(error: TagError) -> Self {
        let (code, message) = match error {
            TagError::NotFound => ("TAG_NOT_FOUND", "标签不存在。"),
            TagError::ValidationFailed => ("TAG_VALIDATION_FAILED", "标签名称无效。"),
            TagError::DuplicateName => ("TAG_DUPLICATE_NAME", "标签名称已存在。"),
            TagError::OperationFailed => ("TAG_OPERATION_FAILED", "标签操作失败，请稍后重试。"),
        };
        Self { code, message }
    }
}
