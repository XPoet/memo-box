use crate::domain::notes::NoteSummary;
use crate::domain::tags::{RenameTagResult, TagCommandError, TagSummary};
use crate::services::tags::TagsService;
use tauri::{AppHandle, Manager};
#[tauri::command]
pub async fn list_tags(app: AppHandle) -> Result<Vec<TagSummary>, TagCommandError> {
    run_blocking(app, |service| service.list()).await
}
#[tauri::command]
pub async fn list_note_tags(
    app: AppHandle,
    note_id: String,
) -> Result<Vec<TagSummary>, TagCommandError> {
    run_blocking(app, move |service| service.list_for_note(&note_id)).await
}
#[tauri::command]
pub async fn create_tag(app: AppHandle, name: String) -> Result<TagSummary, TagCommandError> {
    run_blocking(app, move |service| service.create(&name)).await
}
#[tauri::command]
pub async fn rename_tag(
    app: AppHandle,
    id: String,
    name: String,
) -> Result<RenameTagResult, TagCommandError> {
    run_blocking(app, move |service| service.rename(&id, &name)).await
}
#[tauri::command]
pub async fn merge_tag(
    app: AppHandle,
    source_id: String,
    target_id: String,
) -> Result<(), TagCommandError> {
    run_blocking(app, move |service| service.merge(&source_id, &target_id)).await
}
#[tauri::command]
pub async fn delete_tag(app: AppHandle, id: String) -> Result<(), TagCommandError> {
    run_blocking(app, move |service| service.delete(&id)).await
}
#[tauri::command]
pub async fn set_note_tags(
    app: AppHandle,
    note_id: String,
    tag_ids: Vec<String>,
) -> Result<(), TagCommandError> {
    run_blocking(app, move |service| {
        service.set_note_tags(&note_id, &tag_ids)
    })
    .await
}
#[tauri::command]
pub async fn list_notes_by_tags(
    app: AppHandle,
    tag_ids: Vec<String>,
) -> Result<Vec<NoteSummary>, TagCommandError> {
    run_blocking(app, move |service| service.notes_by_tags(&tag_ids)).await
}
async fn run_blocking<T, F>(app: AppHandle, task: F) -> Result<T, TagCommandError>
where
    T: Send + 'static,
    F: FnOnce(TagsService) -> Result<T, crate::domain::tags::TagError> + Send + 'static,
{
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|_| TagCommandError::from(crate::domain::tags::TagError::OperationFailed))?;
    tauri::async_runtime::spawn_blocking(move || task(TagsService::new(&data_directory)))
        .await
        .map_err(|_| TagCommandError::from(crate::domain::tags::TagError::OperationFailed))?
        .map_err(TagCommandError::from)
}
