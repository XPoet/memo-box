use tauri::{AppHandle, Manager};

use crate::domain::bootstrap::{BootstrapCommandError, BootstrapSnapshot};
use crate::services::bootstrap::BootstrapService;

#[tauri::command]
pub async fn bootstrap_app(app: AppHandle) -> Result<BootstrapSnapshot, BootstrapCommandError> {
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|error| BootstrapCommandError::data_directory_unavailable(error.to_string()))?;

    let snapshot = tauri::async_runtime::spawn_blocking(move || {
        BootstrapService::new(data_directory).bootstrap()
    })
    .await
    .map_err(|_| BootstrapCommandError::bootstrap_failed())?
    .map_err(BootstrapCommandError::from)?;

    Ok(snapshot)
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) -> Result<(), BootstrapCommandError> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(BootstrapCommandError::bootstrap_failed)?;
    window
        .show()
        .map_err(|_| BootstrapCommandError::bootstrap_failed())?;
    window
        .set_focus()
        .map_err(|_| BootstrapCommandError::bootstrap_failed())?;

    Ok(())
}
