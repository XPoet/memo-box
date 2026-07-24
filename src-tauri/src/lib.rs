mod commands;
mod database;
mod domain;
mod repositories;
mod services;

pub fn run() -> Result<(), tauri::Error> {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_window_state::Builder::default().build())?;
            Ok(())
        })
        .manage(services::export::ExportTaskRegistry::default())
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap::bootstrap_app,
            commands::bootstrap::show_main_window,
            commands::notes::create_note,
            commands::notes::list_notes,
            commands::notes::get_note,
            commands::notes::save_note,
            commands::notes::set_note_pinned,
            commands::notes::cleanup_empty_note,
            commands::notes::save_recovery_draft,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::open_data_directory,
            commands::search::search_notes,
            commands::search::rebuild_search_index,
            commands::export::export_notes,
            commands::export::cancel_export,
            commands::export::open_export_directory,
            commands::assets::save_pasted_image,
            commands::assets::get_note_asset_health,
            commands::categories::list_categories,
            commands::categories::create_category,
            commands::categories::rename_category,
            commands::categories::move_category,
            commands::categories::get_category_delete_impact,
            commands::categories::delete_category,
            commands::categories::list_notes_by_category,
            commands::categories::set_note_category,
            commands::tags::list_tags,
            commands::tags::list_note_tags,
            commands::tags::create_tag,
            commands::tags::rename_tag,
            commands::tags::merge_tag,
            commands::tags::delete_tag,
            commands::tags::set_note_tags,
            commands::tags::list_notes_by_tags,
            commands::trash::trash_note,
            commands::trash::list_trashed_notes,
            commands::trash::restore_note,
            commands::trash::permanently_delete_note,
            commands::trash::empty_trash,
        ])
        .run(tauri::generate_context!())
}
