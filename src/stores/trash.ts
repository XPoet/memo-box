import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { listTrashedNotes } from '@/services/trash'
import type { TrashError, TrashedNoteSummary } from '@/types/trash'

export const useTrashStore = defineStore('trash', () => {
  const notes = shallowRef<TrashedNoteSummary[]>([])
  const isLoading = shallowRef(false)
  const error = shallowRef<TrashError>()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      notes.value = await listTrashedNotes()
      error.value = undefined
    } catch (failure: unknown) {
      error.value = failure as TrashError
    } finally {
      isLoading.value = false
    }
  }

  return { notes, isLoading, error, load }
})
