import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteListItem from '@/features/notes/NoteListItem.vue'

describe('NoteListItem', () => {
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
  })
})
