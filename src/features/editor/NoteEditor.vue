<script setup lang="ts">
import { Delete, Folder } from '@element-plus/icons-vue'
import { computed, useTemplateRef, watch } from 'vue'
import MarkdownEditor from './MarkdownEditor.vue'
import MissingAssetNotice from './MissingAssetNotice.vue'
import NoteMetadata from './NoteMetadata.vue'
import SaveStatus from './SaveStatus.vue'
import type { CategoryNode } from '@/types/categories'
import type { SaveStatus as SaveStatusType } from '@/stores/notes'
import type { NoteDetail } from '@/types/notes'
import type { TagSummary } from '@/types/tags'

const props = defineProps<{
  note?: NoteDetail
  saveStatus: SaveStatusType
  saveError?: string
  missingAssetCount: number
  saveImage: (bytes: Uint8Array) => Promise<string>
  categories: CategoryNode[]
  tags: TagSummary[]
  selectedTagIds: string[]
}>()

const emit = defineEmits<{
  update: [change: Pick<NoteDetail, 'title' | 'content'>]
  retry: []
  pasteError: [message: string]
  updateCategory: [categoryId: string | undefined]
  updateTags: [tagIds: string[]]
  createTag: [name: string]
  trash: []
}>()

const titleInput = useTemplateRef<{ focus: () => void }>('titleInput')
const noteId = computed(() => props.note?.id)

watch(noteId, () => {
  requestAnimationFrame(() => titleInput.value?.focus())
})

function updateTitle(title: string): void {
  const note = props.note
  if (note !== undefined) {
    emit('update', { title, content: note.content })
  }
}

function updateContent(content: string): void {
  const note = props.note
  if (note !== undefined) {
    emit('update', { title: note.title, content })
  }
}
</script>

<template>
  <section v-if="note !== undefined" class="note-editor">
    <header class="note-editor-header">
      <p class="note-editor-location">
        <el-icon><Folder /></el-icon>
        Markdown 笔记
      </p>
      <div class="note-editor-status">
        <SaveStatus :status="saveStatus" :message="saveError" />
        <el-button v-if="saveStatus === 'failed'" text type="primary" @click="emit('retry')">
          重试
        </el-button>
        <el-button text type="danger" circle aria-label="移入回收站" @click="emit('trash')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </header>
    <div class="note-editor-content">
      <el-input
        ref="titleInput"
        class="note-title-input"
        :model-value="note.title"
        placeholder="无标题笔记"
        aria-label="笔记标题"
        @update:model-value="updateTitle"
      />
      <NoteMetadata
        :categories="categories"
        :category-id="note.categoryId"
        :tags="tags"
        :selected-tag-ids="selectedTagIds"
        @create-tag="emit('createTag', $event)"
        @update-category="emit('updateCategory', $event)"
        @update-tags="emit('updateTags', $event)"
      />
      <MissingAssetNotice :missing-asset-count="missingAssetCount" />
      <MarkdownEditor
        :key="note.id"
        class="note-editor-body"
        :model-value="note.content"
        :save-image="saveImage"
        @update:model-value="updateContent"
        @paste-error="emit('pasteError', $event)"
      />
    </div>
  </section>
  <section v-else class="editor-empty-state">
    <p class="editor-empty-eyebrow">MemoBox</p>
    <h1 class="editor-empty-title">打开即记</h1>
    <p class="editor-empty-copy">从左侧新建一条笔记，纯文本和图片都会保存在本机。</p>
  </section>
</template>

<style scoped lang="scss">
.note-editor {
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
  min-block-size: 0;
  block-size: 100%;
}

.note-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  padding: 0 var(--space-24);
  border-block-end: 1px solid var(--color-divider);
  background: var(--color-surface);
}

.note-editor-location {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.note-editor-location .el-icon {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.note-title-input {
  inline-size: 100%;
}

.note-title-input :deep(.el-input__wrapper) {
  padding: 0;
  box-shadow: none;
}

.note-title-input :deep(.el-input__inner) {
  block-size: auto;
  color: var(--color-text-primary);
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.note-editor-status {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-shrink: 0;
}

.note-editor-body {
  min-block-size: 0;
}

.note-editor-content {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  min-block-size: 0;
  padding: 30px 44px 0;
  overflow: hidden;
}

.editor-empty-state {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--space-12);
  block-size: 100%;
  padding: var(--space-32);
}

.editor-empty-eyebrow,
.editor-empty-title,
.editor-empty-copy {
  margin: 0;
}

.editor-empty-eyebrow {
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.editor-empty-title {
  color: var(--color-text-primary);
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.04em;
}

.editor-empty-copy {
  max-inline-size: 420px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
</style>
