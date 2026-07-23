import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bootstrapApp, toBootstrapError } from '@/services/bootstrap'
import type { BootstrapError, BootstrapSnapshot } from '@/types/bootstrap'

export type AppBootstrapState = 'idle' | 'loading' | 'ready' | 'failed'

export const useAppStore = defineStore('app', () => {
  const status = ref<AppBootstrapState>('idle')
  const snapshot = ref<BootstrapSnapshot>()
  const error = ref<BootstrapError>()

  async function bootstrap(): Promise<void> {
    status.value = 'loading'
    error.value = undefined

    try {
      snapshot.value = await bootstrapApp()
      status.value = 'ready'
    } catch (failure: unknown) {
      error.value = toBootstrapError(failure)
      status.value = 'failed'
    }
  }

  return {
    status,
    snapshot,
    error,
    bootstrap,
  }
})
