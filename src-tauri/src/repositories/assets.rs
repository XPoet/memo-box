use rusqlite::{Connection, OptionalExtension, params};

use crate::domain::assets::{AssetError, AssetHealth, SavedAsset};

pub struct AssetsRepository;

impl AssetsRepository {
    pub fn is_linked(
        connection: &Connection,
        note_id: &str,
        relative_path: &str,
    ) -> Result<bool, AssetError> {
        connection
            .query_row(
                "SELECT 1 FROM assets
                 INNER JOIN note_assets ON note_assets.asset_id = assets.id
                 INNER JOIN notes ON notes.id = note_assets.note_id
                 WHERE notes.id = ?1 AND notes.is_deleted = 0 AND assets.relative_path = ?2",
                params![note_id, relative_path],
                |_| Ok(()),
            )
            .optional()
            .map(|value| value.is_some())
            .map_err(|_| AssetError::ReadFailed)
    }

    pub fn pending_cleanup_paths(connection: &Connection) -> Result<Vec<String>, AssetError> {
        let mut statement = connection
            .prepare(
                "SELECT relative_path FROM asset_cleanup_queue ORDER BY queued_at, relative_path",
            )
            .map_err(|_| AssetError::SaveFailed)?;
        let rows = statement
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|_| AssetError::SaveFailed)?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|_| AssetError::SaveFailed)
    }

    pub fn mark_cleanup_succeeded(
        connection: &mut Connection,
        relative_path: &str,
    ) -> Result<(), AssetError> {
        connection
            .execute(
                "DELETE FROM asset_cleanup_queue WHERE relative_path = ?1",
                params![relative_path],
            )
            .map_err(|_| AssetError::SaveFailed)?;
        Ok(())
    }

    pub fn mark_cleanup_failed(
        connection: &mut Connection,
        relative_path: &str,
        error_code: &str,
    ) -> Result<(), AssetError> {
        connection
            .execute(
                "UPDATE asset_cleanup_queue SET attempts = attempts + 1, last_error = ?2 WHERE relative_path = ?1",
                params![relative_path, error_code],
            )
            .map_err(|_| AssetError::SaveFailed)?;
        Ok(())
    }

    pub fn note_exists(connection: &Connection, note_id: &str) -> Result<bool, AssetError> {
        connection
            .query_row(
                "SELECT 1 FROM notes WHERE id = ?1 AND is_deleted = 0",
                params![note_id],
                |_| Ok(()),
            )
            .optional()
            .map(|value| value.is_some())
            .map_err(|_| AssetError::SaveFailed)
    }

    pub fn find_by_hash(
        connection: &Connection,
        hash: &str,
    ) -> Result<Option<SavedAsset>, AssetError> {
        connection
            .query_row(
                "SELECT id, relative_path, mime_type, width, height, size
                 FROM assets WHERE hash = ?1",
                params![hash],
                |row| {
                    Ok(SavedAsset {
                        id: row.get(0)?,
                        relative_path: row.get(1)?,
                        mime_type: row.get(2)?,
                        width: row.get(3)?,
                        height: row.get(4)?,
                        size: row.get(5)?,
                    })
                },
            )
            .optional()
            .map_err(|_| AssetError::SaveFailed)
    }

    pub fn link_existing(
        connection: &mut Connection,
        note_id: &str,
        asset_id: &str,
        now: &str,
    ) -> Result<(), AssetError> {
        let transaction = connection
            .transaction()
            .map_err(|_| AssetError::SaveFailed)?;
        transaction
            .execute(
                "INSERT OR IGNORE INTO note_assets (note_id, asset_id, created_at)
                 VALUES (?1, ?2, ?3)",
                params![note_id, asset_id, now],
            )
            .map_err(|_| AssetError::SaveFailed)?;
        transaction.commit().map_err(|_| AssetError::SaveFailed)
    }

    pub fn create_and_link(
        connection: &mut Connection,
        note_id: &str,
        asset: &SavedAsset,
        hash: &str,
        now: &str,
    ) -> Result<(), AssetError> {
        let file_name = file_name(&asset.relative_path)?;
        let extension = extension(&asset.relative_path)?;
        let transaction = connection
            .transaction()
            .map_err(|_| AssetError::SaveFailed)?;
        transaction
            .execute(
                "INSERT INTO assets
                    (id, file_name, original_name, extension, relative_path, mime_type, size, width, height, hash, created_at)
                 VALUES (?1, ?2, NULL, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    asset.id,
                    file_name,
                    extension,
                    asset.relative_path,
                    asset.mime_type,
                    asset.size,
                    asset.width,
                    asset.height,
                    hash,
                    now,
                ],
            )
            .map_err(|_| AssetError::SaveFailed)?;
        transaction
            .execute(
                "INSERT INTO note_assets (note_id, asset_id, created_at) VALUES (?1, ?2, ?3)",
                params![note_id, asset.id, now],
            )
            .map_err(|_| AssetError::SaveFailed)?;
        transaction.commit().map_err(|_| AssetError::SaveFailed)
    }

    pub fn health(
        connection: &Connection,
        assets_directory: &std::path::Path,
        note_id: &str,
    ) -> Result<AssetHealth, AssetError> {
        if !Self::note_exists(connection, note_id)? {
            return Err(AssetError::NoteNotFound);
        }
        let mut statement = connection
            .prepare(
                "SELECT relative_path FROM assets
                 INNER JOIN note_assets ON note_assets.asset_id = assets.id
                 WHERE note_assets.note_id = ?1",
            )
            .map_err(|_| AssetError::SaveFailed)?;
        let paths = statement
            .query_map(params![note_id], |row| row.get::<_, String>(0))
            .map_err(|_| AssetError::SaveFailed)?;
        let mut missing_asset_count = 0;
        for path in paths {
            let relative_path = path.map_err(|_| AssetError::SaveFailed)?;
            let Some(file_name) = std::path::Path::new(&relative_path).file_name() else {
                continue;
            };
            if !assets_directory.join(file_name).is_file() {
                missing_asset_count += 1;
            }
        }
        Ok(AssetHealth {
            missing_asset_count,
        })
    }
}

fn file_name(relative_path: &str) -> Result<String, AssetError> {
    std::path::Path::new(relative_path)
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .map(str::to_owned)
        .ok_or(AssetError::SaveFailed)
}

fn extension(relative_path: &str) -> Result<String, AssetError> {
    std::path::Path::new(relative_path)
        .extension()
        .and_then(std::ffi::OsStr::to_str)
        .map(str::to_owned)
        .ok_or(AssetError::SaveFailed)
}
