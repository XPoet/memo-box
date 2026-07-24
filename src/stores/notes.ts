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
import { listNotesByCategory } from '@/services/categories'
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
  let saveQueue = Promise.resolve()

  const hasSelectedNote = computed(() => selectedNote.value !== undefined)

  async function refreshNotes(): Promise<void> {
    notes.value = await listNotes()
  }

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = undefined
    try {
      await refreshNotes()
      const firstNote = notes.value[0]
      if (firstNote !== undefined) {
        selectedNote.value = await getNote(firstNote.id)
        saveStatus.value = 'saved'
      }
    } catch (failure: unknown) {
      notes.value = []
      selectedNote.value = undefined
      saveStatus.value = 'failed'
      error.value = toNoteError(failure)
    } finally {
      isLoading.value = false
    }
  }

  async function loadByCategory(categoryId?: string): Promise<void> {
    await loadFiltered(() => listNotesByCategory(categoryId))
  }

  async function loadByTags(tagIds: string[]): Promise<void> {
    await loadFiltered(() => listNotesByTags(tagIds))
  }

  async function loadFiltered(fetchNotes: () => Promise<NoteSummary[]>): Promise<void> {
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

  async function create(): Promise<void> {
    await flush()
    const previousNote = selectedNote.value
    if (previousNote !== undefined) {
      await cleanupEmptyNote(previousNote.id)
    }
    selectedNote.value = await createNote()
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
    updateDraft,
    flush,
    selectNote,
    create,
    reloadSelected,
    setPinned,
  }
})
