export type BootstrapStatus = 'ready'

export interface BootstrapSnapshot {
  status: BootstrapStatus
  dataDirectory: string
  schemaVersion: number
}

export type BootstrapErrorCode =
  | 'DATA_DIRECTORY_UNAVAILABLE'
  | 'DATA_DIRECTORY_NOT_WRITABLE'
  | 'DATABASE_OPEN_FAILED'
  | 'DATABASE_LOCKED'
  | 'DATABASE_CORRUPTED'
  | 'MIGRATION_FAILED'
  | 'BOOTSTRAP_FAILED'

export interface BootstrapError {
  code: BootstrapErrorCode
  message: string
}
