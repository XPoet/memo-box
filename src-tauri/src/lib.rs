mod commands;
mod database;
mod domain;
mod repositories;
mod services;

pub fn run() -> Result<(), tauri::Error> {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap::bootstrap_app,
            commands::notes::create_note,
            commands::notes::list_notes,
            commands::notes::get_note,
            commands::notes::save_note,
            commands::notes::cleanup_empty_note,
            commands::notes::save_recovery_draft,
            commands::assets::save_pasted_image,
            commands::assets::get_note_asset_health,
        ])
        .run(tauri::generate_context!())
}
