import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import {
  cleanupEmptyNote,
  createNote,
  getNote,
  listNotes,
  saveNote,
  setNotePinned,
  saveRecoveryDraft,
  toNoteError,
} from '@/services/notes'
import { listNotesByCategory, setNoteCategory } from '@/services/categories'
import { listNotesByTags } from '@/services/tags'
import type { NoteDetail, NoteError, NoteSummary } from '@/types/notes'

export type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'failed'

export const useNotesStore = defineStore('notes', () => {
  const notes = shallowRef<NoteSummary[]>([])
  const selectedNote = shallowRef<NoteDetail>()
  const saveStatus = shallowRef<SaveStatus>('idle')
  const error = shallowRef<NoteError>()
  const isDirty = shallowRef(false)
  const revision = shallowRef(0)
  const isLoading = shallowRef(false)
  let activeNotesFetcher: () => Promise<NoteSummary[]> = listNotes
  let saveQueue = Promise.resolve()

  const hasSelectedNote = computed(() => selectedNote.value !== undefined)

  async function refreshNotes(): Promise<void> {
    notes.value = await activeNotesFetcher()
  }

  async function load(): Promise<void> {
    await loadFiltered(listNotes)
  }

  async function loadByCategory(categoryId?: string): Promise<void> {
    await loadFiltered(() => listNotesByCategory(categoryId))
  }

  async function loadByTags(tagIds: string[]): Promise<void> {
    await loadFiltered(() => listNotesByTags(tagIds))
  }

  async function loadFiltered(fetchNotes: () => Promise<NoteSummary[]>): Promise<void> {
    activeNotesFetcher = fetchNotes
    isLoading.value = true
    error.value = undefined
    try {
      notes.value = await fetchNotes()
      const firstNote = notes.value[0]
      selectedNote.value = firstNote === undefined ? undefined : await getNote(firstNote.id)
      saveStatus.value = firstNote === undefined ? 'idle' : 'saved'
    } catch (failure: unknown) {
      notes.value = []
      selectedNote.value = undefined
      saveStatus.value = 'failed'
      error.value = toNoteError(failure)
    } finally {
      isLoading.value = false
    }
  }

  /** 删除一条笔记后：保持当前筛选重新加载列表，并选中删除处相邻的下一条笔记。 */
  async function reloadAfterTrash(trashedId: string): Promise<void> {
    const removedIndex = notes.value.findIndex((item) => item.id === trashedId)
    await loadFiltered(activeNotesFetcher)
    const total = notes.value.length
    if (total === 0) {
      return
    }
    const targetIndex = Math.min(Math.max(removedIndex, 0), total - 1)
    const target = notes.value[targetIndex]
    if (target.id === selectedNote.value?.id) {
      return
    }
    selectedNote.value = await getNote(target.id)
    saveStatus.value = 'saved'
  }

  function updateDraft(change: Pick<NoteDetail, 'title' | 'content'>): void {
    const note = selectedNote.value
    if (note === undefined) {
      return
    }
    selectedNote.value = { ...note, ...change }
    revision.value += 1
    isDirty.value = true
    saveStatus.value = 'editing'
    error.value = undefined
  }

  async function flush(): Promise<void> {
    const note = selectedNote.value
    if (note === undefined || !isDirty.value) {
      return
    }
    const requestRevision = revision.value
    const draft = { id: note.id, title: note.title, content: note.content }
    saveQueue = saveQueue
      .catch(() => undefined)
      .then(async () => {
        saveStatus.value = 'saving'
        try {
          const saved = await saveNote(draft)
          if (selectedNote.value?.id === saved.id && revision.value === requestRevision) {
            selectedNote.value = saved
            isDirty.value = false
            saveStatus.value = 'saved'
            error.value = undefined
          }
          await refreshNotes()
        } catch (failure: unknown) {
          const saveError = toNoteError(failure)
          if (selectedNote.value?.id === draft.id) {
            saveStatus.value = 'failed'
            error.value = saveError
            void saveRecoveryDraft(draft, saveError.code)
          }
          throw saveError
        }
      })
    return saveQueue
  }

  async function selectNote(id: string): Promise<void> {
    if (selectedNote.value?.id === id) {
      return
    }
    await flush()
    const previousNote = selectedNote.value
    if (previousNote !== undefined) {
      await cleanupEmptyNote(previousNote.id)
    }
    selectedNote.value = await getNote(id)
    isDirty.value = false
    saveStatus.value = 'saved'
    error.value = undefined
    await refreshNotes()
  }

  async function create(categoryId?: string): Promise<void> {
    await flush()
    const previousNote = selectedNote.value
    if (previousNote !== undefined) {
      await cleanupEmptyNote(previousNote.id)
    }
    selectedNote.value = await createNote(categoryId)
    isDirty.value = false
    saveStatus.value = 'editing'
    error.value = undefined
    await refreshNotes()
  }

  async function reloadSelected(): Promise<void> {
    const note = selectedNote.value
    if (note === undefined) return
    selectedNote.value = await getNote(note.id)
    await refreshNotes()
  }

  async function setPinned(pinned: boolean): Promise<void> {
    const note = selectedNote.value
    if (note === undefined) return
    await flush()
    selectedNote.value = await setNotePinned(note.id, pinned)
    await refreshNotes()
  }

  async function moveToCategory(id: string, categoryId?: string): Promise<void> {
    if (!notes.value.some((note) => note.id === id)) return
    await flush()
    const movedIndex = notes.value.findIndex((note) => note.id === id)
    await setNoteCategory(id, categoryId)
    if (selectedNote.value?.id === id) {
      selectedNote.value = { ...selectedNote.value, categoryId }
    }
    await refreshNotes()
    if (selectedNote.value?.id !== id || notes.value.some((note) => note.id === id)) return

    await flush()
    if (selectedNote.value?.id !== id || isDirty.value) return
    const nextNote = notes.value[Math.min(Math.max(movedIndex, 0), notes.value.length - 1)]
    const nextDetail = nextNote === undefined ? undefined : await getNote(nextNote.id)
    if (selectedNote.value?.id !== id || isDirty.value) return
    selectedNote.value = nextDetail
    isDirty.value = false
    saveStatus.value = nextNote === undefined ? 'idle' : 'saved'
    error.value = undefined
  }

  return {
    notes,
    selectedNote,
    saveStatus,
    error,
    isDirty,
    isLoading,
    hasSelectedNote,
    load,
    loadByCategory,
    loadByTags,
    reloadAfterTrash,
    updateDraft,
    flush,
    selectNote,
    create,
    reloadSelected,
    setPinned,
    moveToCategory,
  }
})
