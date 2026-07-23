use std::path::Path;

use rusqlite::Connection;

use crate::database::connection::open_database;
use crate::database::migrations::apply_migrations;
use crate::domain::bootstrap::BootstrapError;

pub struct BootstrapRepository;

impl BootstrapRepository {
    pub fn initialize(database_path: &Path) -> Result<u32, BootstrapError> {
        let mut connection: Connection = open_database(database_path)?;
        apply_migrations(&mut connection)
    }
}
