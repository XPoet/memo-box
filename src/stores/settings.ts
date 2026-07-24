import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { getSettings, saveSettings, toSettingsError } from '@/services/settings'
import type { SaveSettingsRequest, SettingsError, SettingsSnapshot } from '@/types/settings'

function applyAppearance(settings: SettingsSnapshot): void {
  const root = document.documentElement
  root.dataset.theme = settings.theme
  root.style.setProperty('--editor-font-size', `${settings.editorFontSize}px`)
}

export const useSettingsStore = defineStore('settings', () => {
  const snapshot = shallowRef<SettingsSnapshot>()
  const error = shallowRef<SettingsError>()
  const isLoading = shallowRef(false)
  const isSaving = shallowRef(false)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = undefined
    try {
      snapshot.value = await getSettings()
      applyAppearance(snapshot.value)
    } catch (failure: unknown) {
      error.value = toSettingsError(failure)
    } finally {
      isLoading.value = false
    }
  }

  async function save(request: SaveSettingsRequest): Promise<void> {
    isSaving.value = true
    error.value = undefined
    try {
      snapshot.value = await saveSettings(request)
      applyAppearance(snapshot.value)
    } catch (failure: unknown) {
      error.value = toSettingsError(failure)
      throw error.value
    } finally {
      isSaving.value = false
    }
  }

  return { snapshot, error, isLoading, isSaving, load, save }
})
