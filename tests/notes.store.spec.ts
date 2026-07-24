import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const notesService = vi.hoisted(() => ({
  cleanupEmptyNote: vi.fn(),
  createNote: vi.fn(),
  getNote: vi.fn(),
  listNotes: vi.fn(),
  saveNote: vi.fn(),
  setNotePinned: vi.fn(),
  saveRecoveryDraft: vi.fn(),
  toNoteError: vi.fn((error: unknown) => error),
}))

vi.mock('@/services/notes', () => notesService)

import { useNotesStore } from '@/stores/notes'

describe('notes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    for (const method of Object.values(notesService)) {
      if ('mockReset' in method) {
        method.mockReset()
      }
    }
    notesService.listNotes.mockResolvedValue([])
  })

  it('保存失败时保留草稿并允许后续保存队列继续执行', async () => {
    const store = useNotesStore()
    notesService.createNote.mockResolvedValue({
      id: 'note-1',
      title: '',
      content: '',
      createdAt: '2026-07-23T00:00:00Z',
      updatedAt: '2026-07-23T00:00:00Z',
      isPinned: false,
    })
    await store.create()
    store.updateDraft({ title: '标题', content: '正文' })

    const failure = { code: 'NOTE_SAVE_FAILED', message: '保存失败' }
    notesService.saveNote.mockRejectedValueOnce(failure).mockResolvedValueOnce({
      id: 'note-1',
      title: '标题',
      content: '正文',
      createdAt: '2026-07-23T00:00:00Z',
      updatedAt: '2026-07-23T00:00:01Z',
      isPinned: false,
    })
    notesService.toNoteError.mockImplementation((error: unknown) => error)

    await expect(store.flush()).rejects.toEqual(failure)
    expect(store.selectedNote?.content).toBe('正文')
    expect(store.saveStatus).toBe('failed')
    expect(notesService.saveRecoveryDraft).toHaveBeenCalled()

    await expect(store.flush()).resolves.toBeUndefined()
    expect(store.saveStatus).toBe('saved')
  })

  it('加载失败时保留可重试的错误状态，而不抛出未处理拒绝', async () => {
    const store = useNotesStore()
    const failure = { code: 'NOTE_LIST_FAILED', message: '无法读取笔记列表' }
    notesService.listNotes.mockRejectedValueOnce(failure)
    notesService.toNoteError.mockImplementation((error: unknown) => error)

    await expect(store.load()).resolves.toBeUndefined()
    expect(store.error).toEqual(failure)
    expect(store.saveStatus).toBe('failed')
  })

  it('置顶前先写入草稿，再刷新同一列表数据流', async () => {
    const store = useNotesStore()
    const note = {
      id: 'note-1',
      title: '标题',
      content: '正文',
      isPinned: false,
      createdAt: '2026-07-23T00:00:00Z',
      updatedAt: '2026-07-23T00:00:00Z',
    }
    notesService.createNote.mockResolvedValue(note)
    notesService.setNotePinned.mockResolvedValue({ ...note, isPinned: true })
    await store.create()

    await store.setPinned(true)

    expect(notesService.setNotePinned).toHaveBeenCalledWith('note-1', true)
    expect(store.selectedNote?.isPinned).toBe(true)
  })
})
