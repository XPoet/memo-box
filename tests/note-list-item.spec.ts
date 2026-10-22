import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteListItem from '@/features/notes/NoteListItem.vue'

describe('NoteListItem', () => {
  it('只展示笔记内容，不展示创建时间和更新时间', () => {
    const createdAt = new Date(2026, 9, 16, 0, 1, 2).toISOString()
    const updatedAt = new Date(2026, 9, 17, 0, 1, 58).toISOString()
    const wrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'dated-note',
          title: '时间展示',
          contentPreview: '摘要',
          tagNames: [],
          isPinned: false,
          createdAt,
          updatedAt,
        },
        selected: false,
      },
      global: { stubs: { ElIcon: { template: '<i><slot /></i>' } } },
    })

    expect(wrapper.get('.note-list-item-title').text()).toBe('时间展示')
    expect(wrapper.get('.note-list-item-preview').text()).toBe('摘要')
    expect(wrapper.find('time').exists()).toBe(false)
    expect(wrapper.find('[title*="创建时间"], [title*="更新时间"]').exists()).toBe(false)
  })

  it('仅为置顶笔记显示右上角置顶图标', () => {
    const global = {
      stubs: {
        ElIcon: { template: '<i><slot /></i>' },
      },
    }
    const pinnedWrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'pinned-note',
          title: '置顶笔记',
          contentPreview: '摘要',
          tagNames: ['工作', '重要'],
          isPinned: true,
          createdAt: '2026-07-27T00:00:00Z',
          updatedAt: '2026-07-27T00:00:00Z',
        },
        selected: false,
      },
      global,
    })
    const regularWrapper = mount(NoteListItem, {
      props: {
        note: {
          id: 'regular-note',
          title: '普通笔记',
          contentPreview: '摘要',
          tagNames: [],
          isPinned: false,
          createdAt: '2026-07-27T00:00:00Z',
          updatedAt: '2026-07-27T00:00:00Z',
        },
        selected: false,
      },
      global,
    })

    expect(pinnedWrapper.find('.note-list-item-pin').exists()).toBe(true)
    expect(regularWrapper.find('.note-list-item-pin').exists()).toBe(false)
    expect(pinnedWrapper.find('.note-list-item-tags').text()).toBe('#工作 #重要')
    expect(regularWrapper.find('.note-list-item-tags').exists()).toBe(false)
  })
})
