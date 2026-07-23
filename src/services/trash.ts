import { invoke } from '@tauri-apps/api/core'
import type {
  RestoreNoteResult,
  TrashCleanupResult,
  TrashError,
  TrashErrorCode,
  TrashedNoteSummary,
} from '@/types/trash'

interface ErrorPayload {
  code?: unknown
  message?: unknown
}
const errorCodes: TrashErrorCode[] = ['TRASH_NOTE_NOT_FOUND', 'TRASH_OPERATION_FAILED']
function toError(error: unknown): TrashError {
  if (
    typeof error === 'object' &&
    error !== null &&
    errorCodes.includes((error as ErrorPayload).code as TrashErrorCode) &&
    typeof (error as ErrorPayload).message === 'string'
  ) {
    return {
      code: (error as ErrorPayload).code as TrashErrorCode,
      message: (error as ErrorPayload).message as string,
    }
  }
  return { code: 'TRASH_OPERATION_FAILED', message: '回收站操作失败，请稍后重试。' }
}
async function call<T>(command: string, arguments_: Record<string, unknown> = {}): Promise<T> {
  try {
    return await invoke<T>(command, arguments_)
  } catch (error: unknown) {
    throw toError(error)
  }
}
export const trashNote = (id: string): Promise<void> => call('trash_note', { id })
export const listTrashedNotes = (): Promise<TrashedNoteSummary[]> => call('list_trashed_notes')
export const restoreNote = (id: string): Promise<RestoreNoteResult> => call('restore_note', { id })
export const permanentlyDeleteNote = (id: string): Promise<TrashCleanupResult> =>
  call('permanently_delete_note', { id })
export const emptyTrash = (): Promise<TrashCleanupResult> => call('empty_trash')
