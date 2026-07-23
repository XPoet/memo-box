use rusqlite::{Connection, OptionalExtension, params};

use crate::domain::bootstrap::BootstrapError;

struct Migration {
    version: u32,
    name: &'static str,
    sql: &'static str,
}

const MIGRATIONS: [Migration; 3] = [
    Migration {
        version: 1,
        name: "V001__initial_schema",
        sql: include_str!("../../migrations/V001__initial_schema.sql"),
    },
    Migration {
        version: 2,
        name: "V002__asset_cleanup_queue",
        sql: include_str!("../../migrations/V002__asset_cleanup_queue.sql"),
    },
    Migration {
        version: 3,
        name: "V003__add_note_search",
        sql: include_str!("../../migrations/V003__add_note_search.sql"),
    },
];
const LATEST_SCHEMA_VERSION: u32 = 3;

pub fn apply_migrations(connection: &mut Connection) -> Result<u32, BootstrapError> {
    let applied_migrations = read_applied_migrations(connection)?;

    for migration in &MIGRATIONS {
        validate_applied_migration(migration, &applied_migrations)?;
        if applied_migrations
            .iter()
            .any(|(version, _)| *version == migration.version)
        {
            continue;
        }

        let transaction = connection
            .transaction()
            .map_err(BootstrapError::migration_failed)?;
        transaction
            .execute_batch(migration.sql)
            .map_err(BootstrapError::migration_failed)?;
        transaction
            .execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, ?3)",
                params![migration.version, migration.name, current_timestamp()],
            )
            .map_err(BootstrapError::migration_failed)?;
        transaction
            .commit()
            .map_err(BootstrapError::migration_failed)?;
    }

    Ok(LATEST_SCHEMA_VERSION)
}

fn read_applied_migrations(connection: &Connection) -> Result<Vec<(u32, String)>, BootstrapError> {
    let table_exists = connection
        .query_row(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
            [],
            |_| Ok(()),
        )
        .optional()
        .map_err(BootstrapError::migration_failed)?;

    if table_exists.is_none() {
        return Ok(Vec::new());
    }

    let mut statement = connection
        .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
        .map_err(BootstrapError::migration_failed)?;
    let rows = statement
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(BootstrapError::migration_failed)?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(BootstrapError::migration_failed)
}

fn validate_applied_migration(
    migration: &Migration,
    applied_migrations: &[(u32, String)],
) -> Result<(), BootstrapError> {
    for (version, name) in applied_migrations {
        if *version > LATEST_SCHEMA_VERSION {
            return Err(BootstrapError::migration_failed_message(
                "发现当前应用不支持的数据结构版本。",
            ));
        }
        if *version == migration.version && name != migration.name {
            return Err(BootstrapError::migration_failed_message(
                "数据结构版本记录不一致。",
            ));
        }
    }
    Ok(())
}

fn current_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| duration.as_secs());
    format!("{seconds}")
}
