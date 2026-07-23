use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content_preview: String,
    pub category_path: Option<String>,
    pub tag_names: Vec<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchPage {
    pub items: Vec<SearchResult>,
    pub total: u32,
    pub next_offset: Option<u32>,
}

#[derive(Debug, Error)]
pub enum SearchError {
    #[error("搜索关键词或分页参数无效。")]
    Validation,
    #[error("无法查询本地搜索索引。")]
    Query,
    #[error("无法重建本地搜索索引。")]
    IndexRebuild,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<SearchError> for SearchCommandError {
    fn from(error: SearchError) -> Self {
        let (code, message) = match error {
            SearchError::Validation => (
                "SEARCH_VALIDATION_FAILED",
                "搜索关键词或分页参数无效，请调整后重试。",
            ),
            SearchError::Query => (
                "SEARCH_QUERY_FAILED",
                "无法查询本地搜索索引，请重试或重建索引。",
            ),
            SearchError::IndexRebuild => (
                "SEARCH_INDEX_REBUILD_FAILED",
                "无法重建本地搜索索引，请稍后重试。",
            ),
        };
        Self { code, message }
    }
}
