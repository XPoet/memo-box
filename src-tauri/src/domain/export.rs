use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub job_id: String,
    pub scope: ExportScope,
    pub target_directory: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportScope {
    pub kind: ExportScopeKind,
    pub id: String,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ExportScopeKind {
    Note,
    Category,
    CategoryWithDescendants,
    Tag,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportProgress {
    pub total: u32,
    pub processed: u32,
    pub succeeded: u32,
    pub failed: u32,
    pub current_title: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportIssue {
    pub note_id: Option<String>,
    pub title: String,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub job_id: String,
    pub directory_label: String,
    pub exported_count: u32,
    pub failed_count: u32,
    pub cancelled: bool,
    pub issues: Vec<ExportIssue>,
}

#[derive(Debug, Error)]
pub enum ExportError {
    #[error("导出请求无效。")]
    Validation,
    #[error("导出范围不存在或不可用。")]
    ScopeNotFound,
    #[error("目标目录不可用或不可写。")]
    TargetUnavailable,
    #[error("无法生成导出快照。")]
    Snapshot,
    #[error("导出文件写入失败。")]
    Write,
    #[error("无法发送导出进度。")]
    ProgressUnavailable,
    #[error("导出任务不存在或已结束。")]
    TaskNotFound,
    #[error("无法打开导出目录。")]
    Open,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<ExportError> for ExportCommandError {
    fn from(error: ExportError) -> Self {
        let (code, message) = match error {
            ExportError::Validation => {
                ("EXPORT_VALIDATION_FAILED", "导出请求无效，请重新选择范围。")
            }
            ExportError::ScopeNotFound => ("EXPORT_SCOPE_NOT_FOUND", "导出范围不存在或已不可用。"),
            ExportError::TargetUnavailable => (
                "EXPORT_TARGET_UNAVAILABLE",
                "目标目录不可用或不可写，请重新选择。",
            ),
            ExportError::Snapshot => ("EXPORT_SNAPSHOT_FAILED", "无法生成导出快照，请重试。"),
            ExportError::Write => ("EXPORT_WRITE_FAILED", "导出文件写入失败，请检查目标目录。"),
            ExportError::ProgressUnavailable => (
                "EXPORT_PROGRESS_UNAVAILABLE",
                "导出进度通道不可用，已停止继续写入。",
            ),
            ExportError::TaskNotFound => ("EXPORT_TASK_NOT_FOUND", "导出任务不存在或已结束。"),
            ExportError::Open => ("EXPORT_OPEN_FAILED", "无法打开导出目录。"),
        };
        Self { code, message }
    }
}
