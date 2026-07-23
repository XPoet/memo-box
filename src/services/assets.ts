import { invoke } from '@tauri-apps/api/core'
import type { AssetError, AssetErrorCode, AssetHealth, SavedAsset } from '@/types/assets'

interface TauriErrorPayload {
  code?: unknown
  message?: unknown
}

const assetErrorCodes: AssetErrorCode[] = [
  'ASSET_NOTE_NOT_FOUND',
  'INVALID_IMAGE_DATA',
  'UNSUPPORTED_IMAGE_FORMAT',
  'IMAGE_DIMENSIONS_INVALID',
  'ASSET_STORAGE_UNAVAILABLE',
  'ASSET_WRITE_FAILED',
  'ASSET_SAVE_FAILED',
]

function isTauriErrorPayload(value: unknown): value is TauriErrorPayload {
  return typeof value === 'object' && value !== null
}

function isAssetErrorCode(value: unknown): value is AssetErrorCode {
  return typeof value === 'string' && assetErrorCodes.includes(value as AssetErrorCode)
}

export function toAssetError(error: unknown): AssetError {
  if (
    isTauriErrorPayload(error) &&
    isAssetErrorCode(error.code) &&
    typeof error.message === 'string'
  ) {
    return { code: error.code, message: error.message }
  }
  return {
    code: 'ASSET_SAVE_FAILED',
    message: '图片资源保存失败，未插入图片引用。',
  }
}

export async function savePastedImage(noteId: string, bytes: Uint8Array): Promise<SavedAsset> {
  try {
    return await invoke<SavedAsset>('save_pasted_image', { noteId, bytes: Array.from(bytes) })
  } catch (error: unknown) {
    throw toAssetError(error)
  }
}

export async function getNoteAssetHealth(noteId: string): Promise<AssetHealth> {
  try {
    return await invoke<AssetHealth>('get_note_asset_health', { noteId })
  } catch (error: unknown) {
    throw toAssetError(error)
  }
}
