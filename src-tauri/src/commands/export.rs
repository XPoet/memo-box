use tauri::{AppHandle, Manager, State, ipc::Channel};
use tauri_plugin_opener::OpenerExt;

use crate::domain::export::{
    ExportCommandError, ExportError, ExportProgress, ExportRequest, ExportResult,
};
use crate::services::export::{ExportService, ExportTaskRegistry};

#[tauri::command]
pub async fn export_notes(
    app: AppHandle,
    registry: State<'_, ExportTaskRegistry>,
    request: ExportRequest,
    on_progress: Channel<ExportProgress>,
) -> Result<ExportResult, ExportCommandError> {
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|_| ExportCommandError::from(ExportError::Snapshot))?;
    let task_registry = registry.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        ExportService::new(&data_directory).export(&request, &task_registry, |progress| {
            on_progress
                .send(progress)
                .map_err(|_| ExportError::ProgressUnavailable)
        })
    })
    .await
    .map_err(|_| ExportCommandError::from(ExportError::Write))?
    .map_err(ExportCommandError::from)
}

#[tauri::command]
pub fn cancel_export(
    registry: State<'_, ExportTaskRegistry>,
    job_id: String,
) -> Result<(), ExportCommandError> {
    registry.cancel(&job_id).map_err(ExportCommandError::from)
}

#[tauri::command]
pub async fn open_export_directory(
    app: AppHandle,
    registry: State<'_, ExportTaskRegistry>,
    job_id: String,
) -> Result<(), ExportCommandError> {
    let directory = registry
        .completed_directory(&job_id)
        .map_err(ExportCommandError::from)?;
    tauri::async_runtime::spawn_blocking(move || {
        app.opener()
            .open_path(directory.to_string_lossy().into_owned(), None::<String>)
            .map_err(|_| ExportError::Open)
    })
    .await
    .map_err(|_| ExportCommandError::from(ExportError::Open))?
    .map_err(ExportCommandError::from)
}
