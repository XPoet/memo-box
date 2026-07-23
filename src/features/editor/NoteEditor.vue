<script setup lang="ts">
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
      <el-input
        ref="titleInput"
        class="note-title-input"
        :model-value="note.title"
        placeholder="无标题笔记"
        aria-label="笔记标题"
        @update:model-value="updateTitle"
      />
      <div class="note-editor-status">
        <SaveStatus :status="saveStatus" :message="saveError" />
        <el-button v-if="saveStatus === 'failed'" text type="primary" @click="emit('retry')">
          重试
        </el-button>
        <el-button text type="danger" @click="emit('trash')">删除</el-button>
      </div>
    </header>
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
  grid-template-rows: auto auto auto minmax(0, 1fr);
  min-block-size: 0;
  block-size: 100%;
}

.note-editor-header {
  display: flex;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-20) var(--space-24) var(--space-12);
}

.note-title-input {
  flex: 1;
}

.note-title-input :deep(.el-input__wrapper) {
  padding: 0;
  box-shadow: none;
}

.note-title-input :deep(.el-input__inner) {
  block-size: auto;
  color: var(--color-text-primary);
  font-size: 1.375rem;
  font-weight: 650;
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
