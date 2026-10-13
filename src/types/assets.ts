export interface SavedAsset {
  id: string
  relativePath: string
  mimeType: string
  width: number
  height: number
  size: number
}

export interface AssetHealth {
  missingAssetCount: number
}

export type AssetErrorCode =
  | 'ASSET_NOTE_NOT_FOUND'
  | 'INVALID_IMAGE_DATA'
  | 'UNSUPPORTED_IMAGE_FORMAT'
  | 'IMAGE_DIMENSIONS_INVALID'
  | 'ASSET_STORAGE_UNAVAILABLE'
  | 'ASSET_WRITE_FAILED'
  | 'ASSET_SAVE_FAILED'
  | 'ASSET_READ_FAILED'

export interface AssetError {
  code: AssetErrorCode
  message: string
}
