import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SearchResultItem from '@/features/search/SearchResultItem.vue'

describe('SearchResultItem', () => {
  it('以纯文本呈现元信息并将打开意图交给父组件', async () => {
    const wrapper = mount(SearchResultItem, {
      props: {
        result: {
          id: 'note-1',
          title: '',
          contentPreview: '<script>不应作为 HTML 执行</script>',
          categoryPath: '工作 / 项目',
          tagNames: ['本地优先', '开发记录'],
          updatedAt: '2026-07-24T14:32:00Z',
        },
      },
      global: {
        stubs: { ElIcon: { template: '<i><slot /></i>' } },
      },
    })

    expect(wrapper.text()).toContain('无标题笔记')
    expect(wrapper.text()).toContain('工作 / 项目')
    expect(wrapper.text()).toContain('本地优先')
    expect(wrapper.find('script').exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')).toEqual([['note-1']])
  })
})
