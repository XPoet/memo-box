import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const categoriesService = vi.hoisted(() => ({
  listCategories: vi.fn(),
  toCategoryError: vi.fn((error: unknown) => error),
}))

vi.mock('@/services/categories', () => categoriesService)

import { useCategoriesStore } from '@/stores/categories'

describe('categories store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    categoriesService.listCategories.mockReset()
    categoriesService.toCategoryError.mockImplementation((error: unknown) => error)
  })

  it('加载分类树并保留后端返回的层级和统计', async () => {
    categoriesService.listCategories.mockResolvedValue([
      {
        id: 'root',
        name: '项目',
        level: 1,
        sortOrder: 0,
        path: '项目',
        noteCount: 2,
        children: [],
      },
    ])
    const store = useCategoriesStore()
    await store.load()
    expect(store.categories[0]?.noteCount).toBe(2)
    expect(store.error).toBeUndefined()
  })
})
