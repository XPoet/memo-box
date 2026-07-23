import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { listTags, toTagError } from '@/services/tags'
import type { TagError, TagSummary } from '@/types/tags'

export const useTagsStore = defineStore('tags', () => {
  const tags = shallowRef<TagSummary[]>([])
  const isLoading = shallowRef(false)
  const error = shallowRef<TagError>()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      tags.value = await listTags()
      error.value = undefined
    } catch (failure: unknown) {
      error.value = toTagError(failure)
    } finally {
      isLoading.value = false
    }
  }

  return { tags, isLoading, error, load }
})
