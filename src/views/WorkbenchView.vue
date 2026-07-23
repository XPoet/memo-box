<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { getNoteAssetHealth, savePastedImage, toAssetError } from '@/services/assets'
import { useAutoSave } from '@/composables/useAutoSave'
import NoteEditor from '@/features/editor/NoteEditor.vue'
import NoteList from '@/features/notes/NoteList.vue'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import { useAppStore } from '@/stores/app'
import { useNotesStore } from '@/stores/notes'
import type { NoteDetail } from '@/types/notes'

const appStore = useAppStore()
const notesStore = useNotesStore()
const { snapshot } = storeToRefs(appStore)
const { error, isLoading, notes, saveStatus, selectedNote } = storeToRefs(notesStore)
const missingAssetCount = shallowRef(0)
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

async function handleCreate(): Promise<void> {
  try {
    await autoSave.flush()
    await notesStore.create()
  } catch {
    return
  }
}

async function handleLoad(): Promise<void> {
  await notesStore.load()
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
  <WorkspaceLayout :schema-version="snapshot?.schemaVersion ?? 0">
    <template #navigation>
      <nav class="workbench-navigation">
        <p class="navigation-item navigation-item--active">全部笔记</p>
        <p class="navigation-item">最近编辑</p>
        <p class="navigation-section-label">整理</p>
        <p class="navigation-item navigation-item--muted">分类与标签将在后续任务提供</p>
      </nav>
    </template>

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
        @update="updateNote"
        @retry="autoSave.flush().catch(() => undefined)"
        @paste-error="imageError = $event"
      />
      <p v-if="imageError" class="image-error" role="alert">{{ imageError }}</p>
    </template>
  </WorkspaceLayout>
</template>

<style scoped lang="scss">
.workbench-navigation {
  display: grid;
  gap: var(--space-4);
  margin-block-start: var(--space-24);
}

.navigation-item,
.navigation-section-label {
  margin: 0;
}

.navigation-item {
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.navigation-item--active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
}

.navigation-item--muted {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.navigation-section-label {
  margin-block-start: var(--space-16);
  padding-inline: var(--space-12);
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.image-error {
  margin: 0;
  padding: var(--space-8) var(--space-16);
  border-block-start: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
