export type ExportScopeKind = 'note' | 'category' | 'categoryWithDescendants' | 'tag'

export interface ExportScope {
  kind: ExportScopeKind
  id: string
}

export interface ExportScopeOption {
  scope: ExportScope
  title: string
  description: string
}

export interface ExportRequest {
  jobId: string
  scope: ExportScope
  targetDirectory: string
}

export interface ExportProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  currentTitle?: string
}

export interface ExportIssue {
  noteId?: string
  title: string
  code: string
  message: string
}

export interface ExportResult {
  jobId: string
  directoryLabel: string
  exportedCount: number
  failedCount: number
  cancelled: boolean
  issues: ExportIssue[]
}

export type ExportErrorCode =
  | 'EXPORT_VALIDATION_FAILED'
  | 'EXPORT_SCOPE_NOT_FOUND'
  | 'EXPORT_TARGET_UNAVAILABLE'
  | 'EXPORT_SNAPSHOT_FAILED'
  | 'EXPORT_WRITE_FAILED'
  | 'EXPORT_PROGRESS_UNAVAILABLE'
  | 'EXPORT_TASK_NOT_FOUND'
  | 'EXPORT_OPEN_FAILED'

export interface ExportError {
  code: ExportErrorCode
  message: string
}

export type ExportStatus = 'idle' | 'choosing' | 'exporting' | 'completed' | 'failed'
