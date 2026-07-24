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
  let loadingTask: Promise<void> | undefined

  function load(): Promise<void> {
    if (snapshot.value !== undefined) return Promise.resolve()
    if (loadingTask !== undefined) return loadingTask

    isLoading.value = true
    error.value = undefined
    loadingTask = getSettings()
      .then((settings) => {
        snapshot.value = settings
        applyAppearance(settings)
      })
      .catch((failure: unknown) => {
        error.value = toSettingsError(failure)
      })
      .finally(() => {
        isLoading.value = false
        loadingTask = undefined
      })

    return loadingTask
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
