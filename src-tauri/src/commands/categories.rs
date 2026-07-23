use crate::domain::categories::{
    CategoryCommandError, CategoryDeleteImpact, CategoryDeleteMode, CategoryNode,
};
use crate::domain::notes::NoteSummary;
use crate::services::categories::CategoriesService;
use tauri::{AppHandle, Manager};
#[tauri::command]
pub async fn list_categories(app: AppHandle) -> Result<Vec<CategoryNode>, CategoryCommandError> {
    run_blocking(app, |service| service.list()).await
}
#[tauri::command]
pub async fn create_category(
    app: AppHandle,
    name: String,
    parent_id: Option<String>,
) -> Result<CategoryNode, CategoryCommandError> {
    run_blocking(app, move |service| {
        service.create(&name, parent_id.as_deref())
    })
    .await
}
#[tauri::command]
pub async fn rename_category(
    app: AppHandle,
    id: String,
    name: String,
) -> Result<CategoryNode, CategoryCommandError> {
    run_blocking(app, move |service| service.rename(&id, &name)).await
}
#[tauri::command]
pub async fn move_category(
    app: AppHandle,
    id: String,
    parent_id: Option<String>,
    ordered_ids: Vec<String>,
) -> Result<(), CategoryCommandError> {
    run_blocking(app, move |service| {
        service.move_category(&id, parent_id.as_deref(), &ordered_ids)
    })
    .await
}
#[tauri::command]
pub async fn get_category_delete_impact(
    app: AppHandle,
    id: String,
) -> Result<CategoryDeleteImpact, CategoryCommandError> {
    run_blocking(app, move |service| service.impact(&id)).await
}
#[tauri::command]
pub async fn delete_category(
    app: AppHandle,
    id: String,
    mode: CategoryDeleteMode,
) -> Result<(), CategoryCommandError> {
    run_blocking(app, move |service| service.delete(&id, mode)).await
}
#[tauri::command]
pub async fn list_notes_by_category(
    app: AppHandle,
    category_id: Option<String>,
) -> Result<Vec<NoteSummary>, CategoryCommandError> {
    run_blocking(app, move |service| {
        service.notes_by_category(category_id.as_deref())
    })
    .await
}
#[tauri::command]
pub async fn set_note_category(
    app: AppHandle,
    note_id: String,
    category_id: Option<String>,
) -> Result<(), CategoryCommandError> {
    run_blocking(app, move |service| {
        service.set_note_category(&note_id, category_id.as_deref())
    })
    .await
}
async fn run_blocking<T, F>(app: AppHandle, task: F) -> Result<T, CategoryCommandError>
where
    T: Send + 'static,
    F: FnOnce(CategoriesService) -> Result<T, crate::domain::categories::CategoryError>
        + Send
        + 'static,
{
    let data_directory = app.path().app_data_dir().map_err(|_| {
        CategoryCommandError::from(crate::domain::categories::CategoryError::OperationFailed)
    })?;
    tauri::async_runtime::spawn_blocking(move || task(CategoriesService::new(&data_directory)))
        .await
        .map_err(|_| {
            CategoryCommandError::from(crate::domain::categories::CategoryError::OperationFailed)
        })?
        .map_err(CategoryCommandError::from)
}
