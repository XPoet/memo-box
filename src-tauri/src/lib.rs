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
