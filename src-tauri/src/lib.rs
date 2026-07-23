mod commands;
mod database;
mod domain;
mod repositories;
mod services;

pub fn run() -> Result<(), tauri::Error> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::bootstrap::bootstrap_app])
        .run(tauri::generate_context!())
}
