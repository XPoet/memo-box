import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const categoriesService = vi.hoisted(() => ({
  listCategories: vi.fn(),
  moveCategory: vi.fn(),
  toCategoryError: vi.fn((error: unknown) => error),
}))

vi.mock('@/services/categories', () => categoriesService)

import { useCategoriesStore } from '@/stores/categories'

describe('categories store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    categoriesService.listCategories.mockReset()
    categoriesService.moveCategory.mockReset()
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

  it('移动成功后用后端分类树一次性替换共享状态', async () => {
    const original = {
      id: 'source',
      name: '原分类',
      level: 1,
      sortOrder: 0,
      path: '原分类',
      noteCount: 1,
      children: [],
    }
    const moved = {
      ...original,
      parentId: 'target',
      level: 2,
      path: '目标分类 / 原分类',
    }
    categoriesService.listCategories.mockResolvedValueOnce([original]).mockResolvedValueOnce([
      {
        id: 'target',
        name: '目标分类',
        level: 1,
        sortOrder: 0,
        path: '目标分类',
        noteCount: 1,
        children: [moved],
      },
    ])
    categoriesService.moveCategory.mockResolvedValue(undefined)
    const store = useCategoriesStore()
    await store.load()

    await store.move('source', 'target', ['source'])

    expect(categoriesService.moveCategory).toHaveBeenCalledWith('source', 'target', ['source'])
    expect(store.categories[0]?.children[0]?.path).toBe('目标分类 / 原分类')
    expect(store.error).toBeUndefined()
  })
})
