use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

use crate::domain::settings::{
    SaveSettingsRequest, SettingsCommandError, SettingsError, SettingsSnapshot,
};
use crate::services::settings::SettingsService;

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<SettingsSnapshot, SettingsCommandError> {
    let app_version = app.package_info().version.to_string();
    run_blocking(app, move |service| service.get(&app_version)).await
}

#[tauri::command]
pub async fn save_settings(
    app: AppHandle,
    request: SaveSettingsRequest,
) -> Result<SettingsSnapshot, SettingsCommandError> {
    let app_version = app.package_info().version.to_string();
    run_blocking(app, move |service| service.save(&request, &app_version)).await
}

#[tauri::command]
pub async fn open_data_directory(app: AppHandle) -> Result<(), SettingsCommandError> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|_| SettingsCommandError::from(SettingsError::DirectoryUnavailable))?;
    tauri::async_runtime::spawn_blocking(move || {
        app.opener()
            .open_path(directory.to_string_lossy().into_owned(), None::<String>)
            .map_err(|_| SettingsError::OpenFailed)
    })
    .await
    .map_err(|_| SettingsCommandError::from(SettingsError::OpenFailed))?
    .map_err(SettingsCommandError::from)
}

async fn run_blocking<T, F>(app: AppHandle, task: F) -> Result<T, SettingsCommandError>
where
    T: Send + 'static,
    F: FnOnce(SettingsService) -> Result<T, SettingsError> + Send + 'static,
{
    let data_directory = app
        .path()
        .app_data_dir()
        .map_err(|_| SettingsCommandError::from(SettingsError::DirectoryUnavailable))?;
    tauri::async_runtime::spawn_blocking(move || task(SettingsService::new(&data_directory)))
        .await
        .map_err(|_| SettingsCommandError::from(SettingsError::SaveFailed))?
        .map_err(SettingsCommandError::from)
}
