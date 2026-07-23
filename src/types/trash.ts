import type { NoteDetail } from './notes'

export interface TrashedNoteSummary {
  id: string
  title: string
  contentPreview: string
  deletedAt: string
  trashedFromCategoryPath?: string
}

export interface RestoreNoteResult {
  note: NoteDetail
  restoredToUncategorized: boolean
}

export interface TrashCleanupResult {
  deletedNoteCount: number
  pendingFileCleanupCount: number
}

export type TrashErrorCode = 'TRASH_NOTE_NOT_FOUND' | 'TRASH_OPERATION_FAILED'

export interface TrashError {
  code: TrashErrorCode
  message: string
}
