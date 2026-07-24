import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const settingsService = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  toSettingsError: vi.fn((error: unknown) => error),
}))

vi.mock('@/services/settings', () => settingsService)

import { useSettingsStore } from '@/stores/settings'

const snapshot = {
  theme: 'dark' as const,
  noteSort: 'title' as const,
  editorFontSize: 17 as const,
  showCategoryCounts: false,
  defaultExportDirectoryLabel: '导出',
  appVersion: '0.1.0',
  schemaVersion: 3,
}

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    settingsService.getSettings.mockReset()
    settingsService.saveSettings.mockReset()
    settingsService.toSettingsError.mockImplementation((error: unknown) => error)
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('--editor-font-size')
  })

  it('读取设置后立即恢复主题与编辑器字体大小', async () => {
    settingsService.getSettings.mockResolvedValue(snapshot)
    const store = useSettingsStore()

    await store.load()

    expect(store.snapshot).toEqual(snapshot)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--editor-font-size')).toBe('17px')
  })

  it('重复进入设置不会重复读取已经加载的快照', async () => {
    settingsService.getSettings.mockResolvedValue(snapshot)
    const store = useSettingsStore()

    await store.load()
    await store.load()

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1)
  })

  it('保存合法设置后仅保留安全快照，不持久化目录绝对路径', async () => {
    settingsService.saveSettings.mockResolvedValue(snapshot)
    const store = useSettingsStore()

    await store.save({
      theme: 'dark',
      noteSort: 'title',
      editorFontSize: 17,
      showCategoryCounts: false,
      defaultExportDirectory: '/private/export-target',
    })

    expect(settingsService.saveSettings).toHaveBeenCalled()
    expect(JSON.stringify(store.snapshot)).not.toContain('/private/export-target')
  })
})
