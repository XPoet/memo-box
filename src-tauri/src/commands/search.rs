use tauri::{AppHandle, Manager};

use crate::domain::search::{SearchCommandError, SearchPage};
use crate::services::search::SearchService;

#[tauri::command]
pub async fn search_notes(
    app: AppHandle,
    query: String,
    offset: Option<u32>,
    limit: Option<u32>,
) -> Result<SearchPage, SearchCommandError> {
    run_blocking(app, move |service| service.search(&query, offset, limit)).await
}

#[tauri::command]
pub async fn rebuild_search_index(app: AppHandle) -> Result<(), SearchCommandError> {
    run_blocking(app, |service| service.rebuild()).await
}

async fn run_blocking<T, F>(app: AppHandle, task: F) -> Result<T, SearchCommandError>
where
    T: Send + 'static,
    F: FnOnce(SearchService) -> Result<T, crate::domain::search::SearchError> + Send + 'static,
{
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|_| SearchCommandError::from(crate::domain::search::SearchError::Query))?;
    tauri::async_runtime::spawn_blocking(move || task(SearchService::new(&data_directory)))
        .await
        .map_err(|_| SearchCommandError::from(crate::domain::search::SearchError::Query))?
        .map_err(SearchCommandError::from)
}
