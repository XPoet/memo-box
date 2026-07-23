import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tagsService = vi.hoisted(() => ({
  listTags: vi.fn(),
  toTagError: vi.fn((error: unknown) => error),
}))

vi.mock('@/services/tags', () => tagsService)

import { useTagsStore } from '@/stores/tags'

describe('tags store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    tagsService.listTags.mockReset()
    tagsService.toTagError.mockImplementation((error: unknown) => error)
  })

  it('后端失败时保留安全错误信息以便重试', async () => {
    const failure = { code: 'TAG_OPERATION_FAILED', message: '标签操作失败' }
    tagsService.listTags.mockRejectedValue(failure)
    const store = useTagsStore()
    await store.load()
    expect(store.error).toEqual(failure)
  })
})
