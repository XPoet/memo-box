use std::fs;
use std::path::{Path, PathBuf};

use crate::domain::bootstrap::{BootstrapError, BootstrapSnapshot};
use crate::repositories::bootstrap::BootstrapRepository;
use crate::services::assets::AssetsService;
use crate::services::search::SearchService;

pub struct BootstrapService {
    data_directory: PathBuf,
}

impl BootstrapService {
    pub fn new(data_directory: PathBuf) -> Self {
        Self { data_directory }
    }

    pub fn bootstrap(&self) -> Result<BootstrapSnapshot, BootstrapError> {
        self.create_required_directories()?;
        let database_path = self.data_directory.join("database").join("memobox.db");
        let schema_version = BootstrapRepository::initialize(&database_path)?;
        SearchService::new(&self.data_directory)
            .rebuild()
            .map_err(|_| BootstrapError::MigrationFailed)?;
        let _ = AssetsService::new(&self.data_directory).cleanup_pending();

        Ok(BootstrapSnapshot {
            status: "ready",
            data_directory: self.data_directory.to_string_lossy().into_owned(),
            schema_version,
        })
    }

    fn create_required_directories(&self) -> Result<(), BootstrapError> {
        for directory_name in ["database", "assets", "temp", "logs", "config"] {
            fs::create_dir_all(self.data_directory.join(directory_name))
                .map_err(map_directory_error)?;
        }
        verify_directory_writable(&self.data_directory)
    }
}

fn verify_directory_writable(directory: &Path) -> Result<(), BootstrapError> {
    let metadata = fs::metadata(directory).map_err(map_directory_error)?;
    if metadata.permissions().readonly() {
        return Err(BootstrapError::DataDirectoryNotWritable);
    }
    Ok(())
}

fn map_directory_error(error: std::io::Error) -> BootstrapError {
    match error.kind() {
        std::io::ErrorKind::PermissionDenied => BootstrapError::DataDirectoryNotWritable,
        _ => BootstrapError::DataDirectoryUnavailable,
    }
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use rusqlite::Connection;

    use super::BootstrapService;

    fn test_data_directory() -> std::path::PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |duration| duration.as_nanos());
        std::env::temp_dir().join(format!("memo-box-bootstrap-{timestamp}"))
    }

    #[test]
    fn initializes_required_directories_and_applies_migration_idempotently()
    -> Result<(), Box<dyn std::error::Error>> {
        let data_directory = test_data_directory();
        let service = BootstrapService::new(data_directory.clone());

        let first_snapshot = service.bootstrap()?;
        let second_snapshot = service.bootstrap()?;

        assert_eq!(first_snapshot.status, "ready");
        assert_eq!(first_snapshot.schema_version, 3);
        assert_eq!(second_snapshot.schema_version, 3);
        for directory_name in ["database", "assets", "temp", "logs", "config"] {
            assert!(data_directory.join(directory_name).is_dir());
        }

        let database = Connection::open(data_directory.join("database").join("memobox.db"))?;
        let migration_count: u32 =
            database.query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })?;
        let table_count: u32 = database.query_row(
      "SELECT COUNT(*) FROM sqlite_master WHERE name IN ('notes', 'categories', 'tags', 'assets', 'app_settings', 'recovery_drafts', 'asset_cleanup_queue', 'notes_fts')",
      [],
      |row| row.get(0),
    )?;
        assert_eq!(migration_count, 3);
        assert_eq!(table_count, 8);

        Ok(())
    }
}
