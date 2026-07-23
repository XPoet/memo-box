use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryNode {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub level: i64,
    pub sort_order: i64,
    pub path: String,
    pub note_count: u32,
    pub children: Vec<CategoryNode>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDeleteImpact {
    pub direct_note_count: u32,
    pub branch_note_count: u32,
    pub child_category_count: u32,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CategoryDeleteMode {
    Current,
    Branch,
}

#[derive(Debug, Error)]
pub enum CategoryError {
    #[error("分类不存在。")]
    NotFound,
    #[error("分类名称或排序参数无效。")]
    ValidationFailed,
    #[error("同一层级已存在同名分类。")]
    DuplicateName,
    #[error("分类层级不能超过五级。")]
    MaxDepthExceeded,
    #[error("不能将分类移动到自身或其后代。")]
    CycleDetected,
    #[error("分类操作失败。")]
    OperationFailed,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<CategoryError> for CategoryCommandError {
    fn from(error: CategoryError) -> Self {
        let (code, message) = match error {
            CategoryError::NotFound => ("CATEGORY_NOT_FOUND", "分类不存在。"),
            CategoryError::ValidationFailed => {
                ("CATEGORY_VALIDATION_FAILED", "分类名称或排序参数无效。")
            }
            CategoryError::DuplicateName => ("CATEGORY_DUPLICATE_NAME", "同一层级已存在同名分类。"),
            CategoryError::MaxDepthExceeded => {
                ("CATEGORY_MAX_DEPTH_EXCEEDED", "分类层级不能超过五级。")
            }
            CategoryError::CycleDetected => {
                ("CATEGORY_CYCLE_DETECTED", "不能将分类移动到自身或其后代。")
            }
            CategoryError::OperationFailed => {
                ("CATEGORY_OPERATION_FAILED", "分类操作失败，请稍后重试。")
            }
        };
        Self { code, message }
    }
}
