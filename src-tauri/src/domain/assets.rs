use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedAsset {
    pub id: String,
    pub relative_path: String,
    pub mime_type: String,
    pub width: u32,
    pub height: u32,
    pub size: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetHealth {
    pub missing_asset_count: u32,
}

#[derive(Debug, Error)]
pub enum AssetError {
    #[error("笔记不存在或已删除。")]
    NoteNotFound,
    #[error("图片数据无效。")]
    InvalidImageData,
    #[error("暂不支持该图片格式。")]
    UnsupportedImageFormat,
    #[error("图片尺寸无效。")]
    InvalidDimensions,
    #[error("本地资源目录不可用。")]
    StorageUnavailable,
    #[error("图片写入失败。")]
    WriteFailed,
    #[error("图片资源保存失败。")]
    SaveFailed,
    #[error("图片资源无法读取。")]
    ReadFailed,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetCommandError {
    pub code: &'static str,
    pub message: &'static str,
}

impl From<AssetError> for AssetCommandError {
    fn from(error: AssetError) -> Self {
        let (code, message) = match error {
            AssetError::NoteNotFound => ("ASSET_NOTE_NOT_FOUND", "笔记不存在或已删除。"),
            AssetError::InvalidImageData => {
                ("INVALID_IMAGE_DATA", "图片数据无效，未插入图片引用。")
            }
            AssetError::UnsupportedImageFormat => (
                "UNSUPPORTED_IMAGE_FORMAT",
                "暂不支持该图片格式，未插入图片引用。",
            ),
            AssetError::InvalidDimensions => {
                ("IMAGE_DIMENSIONS_INVALID", "图片尺寸无效，未插入图片引用。")
            }
            AssetError::StorageUnavailable => (
                "ASSET_STORAGE_UNAVAILABLE",
                "本地资源目录不可用，未插入图片引用。",
            ),
            AssetError::WriteFailed => ("ASSET_WRITE_FAILED", "图片写入失败，未插入图片引用。"),
            AssetError::SaveFailed => ("ASSET_SAVE_FAILED", "图片资源保存失败，未插入图片引用。"),
            AssetError::ReadFailed => ("ASSET_READ_FAILED", "图片无法读取，资源缺失或文件无效。"),
        };
        Self { code, message }
    }
}
