import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { listCategories, toCategoryError } from '@/services/categories'
import type { CategoryError, CategoryNode } from '@/types/categories'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = shallowRef<CategoryNode[]>([])
  const isLoading = shallowRef(false)
  const error = shallowRef<CategoryError>()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      categories.value = await listCategories()
      error.value = undefined
    } catch (failure: unknown) {
      error.value = toCategoryError(failure)
    } finally {
      isLoading.value = false
    }
  }

  return { categories, isLoading, error, load }
})
