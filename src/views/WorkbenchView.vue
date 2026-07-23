<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { getNoteAssetHealth, savePastedImage, toAssetError } from '@/services/assets'
import { useAutoSave } from '@/composables/useAutoSave'
import NoteEditor from '@/features/editor/NoteEditor.vue'
import NoteList from '@/features/notes/NoteList.vue'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import { useNotesStore } from '@/stores/notes'
import { useCategoriesStore } from '@/stores/categories'
import { useTagsStore } from '@/stores/tags'
import { createTag, listNoteTags, setNoteTags } from '@/services/tags'
import { setNoteCategory } from '@/services/categories'
import { trashNote } from '@/services/trash'
import type { NoteDetail } from '@/types/notes'

const notesStore = useNotesStore()
const categoriesStore = useCategoriesStore()
const tagsStore = useTagsStore()
const route = useRoute()
const router = useRouter()
const { error, isLoading, notes, saveStatus, selectedNote } = storeToRefs(notesStore)
const missingAssetCount = shallowRef(0)
const selectedTagIds = shallowRef<string[]>([])
const imageError = shallowRef<string>()
let unlistenCloseRequested: (() => void) | undefined
let allowingWindowClose = false
let isHandlingClose = false

const autoSave = useAutoSave(async () => {
  await notesStore.flush()
})

async function refreshAssetHealth(noteId: string | undefined): Promise<void> {
  if (noteId === undefined) {
    missingAssetCount.value = 0
    return
  }
  try {
    missingAssetCount.value = (await getNoteAssetHealth(noteId)).missingAssetCount
  } catch {
    missingAssetCount.value = 0
  }
}

watch(
  () => selectedNote.value?.id,
  (noteId) => {
    void refreshAssetHealth(noteId)
  },
  { immediate: true },
)

watch(
  () => [route.query.category, route.query.tags, route.query.note] as const,
  async ([category, tags, note]) => {
    const categoryId = typeof category === 'string' ? category : undefined
    const tagIds = typeof tags === 'string' ? tags.split(',').filter(Boolean) : []
    if (categoryId !== undefined) {
      await notesStore.loadByCategory(categoryId)
    } else if (tagIds.length > 0) {
      await notesStore.loadByTags(tagIds)
    } else {
      await notesStore.load()
    }
    if (typeof note === 'string' && notes.value.some((item) => item.id === note)) {
      await notesStore.selectNote(note)
    }
  },
  { immediate: true },
)

watch(
  () => route.query.create,
  async (create) => {
    if (create !== '1') {
      return
    }
    if (await handleCreate()) {
      await router.replace({ name: 'workbench' })
    }
  },
  { immediate: true },
)

watch(
  () => selectedNote.value?.id,
  async (noteId) => {
    if (noteId === undefined) {
      selectedTagIds.value = []
      return
    }
    try {
      selectedTagIds.value = (await listNoteTags(noteId)).map((tag) => tag.id)
    } catch {
      selectedTagIds.value = []
    }
  },
  { immediate: true },
)

function updateNote(change: Pick<NoteDetail, 'title' | 'content'>): void {
  notesStore.updateDraft(change)
  autoSave.schedule()
}

async function saveImage(bytes: Uint8Array): Promise<string> {
  const note = selectedNote.value
  if (note === undefined) {
    throw new Error('请先新建或选择一条笔记。')
  }
  try {
    const asset = await savePastedImage(note.id, bytes)
    imageError.value = undefined
    await refreshAssetHealth(note.id)
    return `![图片](./${asset.relativePath})`
  } catch (failure: unknown) {
    const assetError = toAssetError(failure)
    imageError.value = assetError.message
    throw new Error(assetError.message)
  }
}

async function handleCreate(): Promise<boolean> {
  try {
    await autoSave.flush()
    await notesStore.create()
    return true
  } catch {
    return false
  }
}

async function handleLoad(): Promise<void> {
  await notesStore.load()
  await Promise.all([categoriesStore.load(), tagsStore.load()])
}

async function handleTrash(): Promise<void> {
  const note = selectedNote.value
  if (note === undefined) {
    return
  }
  const shouldTrash = await ElMessageBox.confirm(
    '笔记将移入回收站，之后可恢复。是否继续？',
    '确认删除笔记',
    {
      confirmButtonText: '移入回收站',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(() => true)
    .catch(() => false)
  if (!shouldTrash) {
    return
  }
  await autoSave.flush()
  await trashNote(note.id)
  ElMessage.success('笔记已移入回收站。')
  await notesStore.load()
}

async function handleUpdateCategory(categoryId: string | undefined): Promise<void> {
  const note = selectedNote.value
  if (note === undefined) return
  await autoSave.flush()
  await setNoteCategory(note.id, categoryId)
  await notesStore.reloadSelected()
  await categoriesStore.load()
}

async function handleUpdateTags(tagIds: string[]): Promise<void> {
  const note = selectedNote.value
  if (note === undefined) return
  await autoSave.flush()
  await setNoteTags(note.id, tagIds)
  selectedTagIds.value = tagIds
  await tagsStore.load()
}

async function handleCreateTag(name: string): Promise<void> {
  const tag = await createTag(name)
  await tagsStore.load()
  if (!selectedTagIds.value.includes(tag.id)) {
    await handleUpdateTags([...selectedTagIds.value, tag.id])
  }
}

async function handleSelect(id: string): Promise<void> {
  try {
    await autoSave.flush()
    await notesStore.selectNote(id)
  } catch {
    return
  }
}

function handleKeyboardShortcut(event: KeyboardEvent): void {
  if (!event.metaKey && !event.ctrlKey) {
    return
  }
  if (event.key.toLowerCase() === 'n') {
    event.preventDefault()
    void handleCreate()
  }
  if (event.key.toLowerCase() === 's') {
    event.preventDefault()
    void autoSave.flush().catch(() => undefined)
  }
}

onMounted(async () => {
  await handleLoad()
  window.addEventListener('keydown', handleKeyboardShortcut)
  try {
    unlistenCloseRequested = await getCurrentWindow().onCloseRequested(async (event) => {
      if (allowingWindowClose) {
        return
      }
      event.preventDefault()
      if (isHandlingClose) {
        return
      }
      isHandlingClose = true
      try {
        await autoSave.flush()
        allowingWindowClose = true
        await getCurrentWindow().close()
      } catch {
        allowingWindowClose = false
      } finally {
        isHandlingClose = false
      }
    })
  } catch {}
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut)
  unlistenCloseRequested?.()
})
</script>

<template>
  <WorkspaceLayout
    :categories="categoriesStore.categories"
    :tag-count="tagsStore.tags.length"
    @create="handleCreate"
  >
    <template #list>
      <NoteList
        :notes="notes"
        :selected-id="selectedNote?.id"
        :loading="isLoading"
        :error="error?.message"
        @create="handleCreate"
        @retry="handleLoad"
        @select="handleSelect"
      />
    </template>

    <template #editor>
      <NoteEditor
        :note="selectedNote"
        :save-status="saveStatus"
        :save-error="error?.message"
        :missing-asset-count="missingAssetCount"
        :save-image="saveImage"
        :categories="categoriesStore.categories"
        :tags="tagsStore.tags"
        :selected-tag-ids="selectedTagIds"
        @update="updateNote"
        @update-category="handleUpdateCategory"
        @update-tags="handleUpdateTags"
        @create-tag="handleCreateTag"
        @trash="handleTrash"
        @retry="autoSave.flush().catch(() => undefined)"
        @paste-error="imageError = $event"
      />
      <p v-if="imageError" class="image-error" role="alert">{{ imageError }}</p>
    </template>
  </WorkspaceLayout>
</template>

<style scoped lang="scss">
.image-error {
  margin: 0;
  padding: var(--space-8) var(--space-16);
  border-block-start: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
