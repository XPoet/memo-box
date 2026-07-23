use tauri::{AppHandle, Manager};

use crate::domain::trash::{
    RestoreNoteResult, TrashCleanupResult, TrashCommandError, TrashedNoteSummary,
};
use crate::services::trash::TrashService;

#[tauri::command]
pub async fn trash_note(app: AppHandle, id: String) -> Result<(), TrashCommandError> {
    run_blocking(app, move |service| service.trash(&id)).await
}
#[tauri::command]
pub async fn list_trashed_notes(
    app: AppHandle,
) -> Result<Vec<TrashedNoteSummary>, TrashCommandError> {
    run_blocking(app, |service| service.list()).await
}
#[tauri::command]
pub async fn restore_note(
    app: AppHandle,
    id: String,
) -> Result<RestoreNoteResult, TrashCommandError> {
    run_blocking(app, move |service| service.restore(&id)).await
}
#[tauri::command]
pub async fn permanently_delete_note(
    app: AppHandle,
    id: String,
) -> Result<TrashCleanupResult, TrashCommandError> {
    run_blocking(app, move |service| service.permanently_delete(&id)).await
}
#[tauri::command]
pub async fn empty_trash(app: AppHandle) -> Result<TrashCleanupResult, TrashCommandError> {
    run_blocking(app, |service| service.empty()).await
}

async fn run_blocking<T, F>(app: AppHandle, task: F) -> Result<T, TrashCommandError>
where
    T: Send + 'static,
    F: FnOnce(TrashService) -> Result<T, crate::domain::trash::TrashError> + Send + 'static,
{
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|_| TrashCommandError::from(crate::domain::trash::TrashError::OperationFailed))?;
    tauri::async_runtime::spawn_blocking(move || task(TrashService::new(&data_directory)))
        .await
        .map_err(|_| TrashCommandError::from(crate::domain::trash::TrashError::OperationFailed))?
        .map_err(TrashCommandError::from)
}
