import { invoke } from '@tauri-apps/api/core'

/** 在首屏绘制完成后显示原生主窗口，避免暴露 WebView 的空白初始帧。 */
export async function showMainWindow(): Promise<void> {
  try {
    await invoke<void>('show_main_window')
  } catch {}
}

/** 在所有待保存内容落盘后退出应用，避免在关闭事件回调中递归关闭窗口。 */
export async function exitApplication(): Promise<void> {
  await invoke<void>('exit_application')
}
