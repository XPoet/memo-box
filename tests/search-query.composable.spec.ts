import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSearchQuery } from '@/composables/useSearchQuery'

describe('useSearchQuery', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('仅在 250 ms 防抖结束后发起搜索，并取消此前输入', async () => {
    vi.useFakeTimers()
    const onSearch = vi.fn().mockResolvedValue(undefined)
    const Host = defineComponent({
      setup() {
        const { schedule } = useSearchQuery(onSearch)
        return () => h('button', { onClick: () => schedule('本地数据') }, '搜索')
      },
    })
    const wrapper = mount(Host)

    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    vi.advanceTimersByTime(249)
    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onSearch).toHaveBeenCalledOnce()
    expect(onSearch).toHaveBeenCalledWith('本地数据')
  })
})
