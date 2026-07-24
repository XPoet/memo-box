import { describe, expect, it, vi } from 'vitest'

const invoke = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/api/core', () => ({ invoke }))

import { showMainWindow } from '@/services/window'

describe('window service', () => {
  it('只请求受控的主窗口显示命令', async () => {
    invoke.mockResolvedValue(undefined)

    await showMainWindow()

    expect(invoke).toHaveBeenCalledWith('show_main_window')
  })

  it('静态预览缺少原生 IPC 时保持页面可用', async () => {
    invoke.mockRejectedValue(new Error('Tauri IPC unavailable'))

    await expect(showMainWindow()).resolves.toBeUndefined()
  })
})
