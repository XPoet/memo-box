<script setup lang="ts">
import { Delete, Download, Folder, MoreFilled, Star, StarFilled } from '@element-plus/icons-vue'
import { computed, useTemplateRef, watch } from 'vue'
import EditorStatusBar from './EditorStatusBar.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import MissingAssetNotice from './MissingAssetNotice.vue'
import NoteMetadata from './NoteMetadata.vue'
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
  export: []
  trash: []
  togglePin: []
}>()

const titleInput = useTemplateRef<{ focus: () => void }>('titleInput')
const markdownEditor = useTemplateRef<{ focus: () => void }>('markdownEditor')
const noteId = computed(() => props.note?.id)
const noteCategoryPath = computed(
  () => findCategoryPath(props.categories, props.note?.categoryId) ?? '未分类',
)

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

function findCategoryPath(categories: CategoryNode[], categoryId?: string): string | undefined {
  if (categoryId === undefined) return undefined

  for (const category of categories) {
    if (category.id === categoryId) return category.path

    const childPath = findCategoryPath(category.children, categoryId)
    if (childPath !== undefined) return childPath
  }

  return undefined
}

function focusEditor(): void {
  markdownEditor.value?.focus()
}

defineExpose({ focusEditor })
</script>

<template>
  <section v-if="note !== undefined" class="note-editor">
    <header class="note-editor-header">
      <p class="note-editor-location">
        <el-icon><Folder /></el-icon>
        {{ noteCategoryPath }}
      </p>
      <div class="note-editor-actions">
        <el-button
          text
          circle
          :icon="note.isPinned ? StarFilled : Star"
          @click="emit('togglePin')"
        />
        <el-button text circle :icon="Download" @click="emit('export')" />
        <el-button text type="danger" circle :icon="Delete" @click="emit('trash')" />
        <el-popover placement="bottom-end" :width="360" trigger="click">
          <template #reference>
            <el-button text circle :icon="MoreFilled" />
          </template>
          <NoteMetadata
            :categories="categories"
            :category-id="note.categoryId"
            :tags="tags"
            :selected-tag-ids="selectedTagIds"
            @create-tag="emit('createTag', $event)"
            @update-category="emit('updateCategory', $event)"
            @update-tags="emit('updateTags', $event)"
          />
        </el-popover>
      </div>
    </header>
    <div class="note-editor-content">
      <el-input
        ref="titleInput"
        class="note-title-input"
        :model-value="note.title"
        placeholder="无标题笔记"
        @update:model-value="updateTitle"
      />
      <MissingAssetNotice v-if="missingAssetCount" :missing-asset-count="missingAssetCount" />
      <div class="note-editor-body">
        <MarkdownEditor
          ref="markdownEditor"
          :key="note.id"
          :note-id="note.id"
          class="note-editor-markdown"
          :model-value="note.content"
          :save-image="saveImage"
          @update:model-value="updateContent"
          @paste-error="emit('pasteError', $event)"
        />
      </div>
    </div>
    <EditorStatusBar
      :content="note.content"
      :save-status="saveStatus"
      :save-error="saveError"
      @retry="emit('retry')"
    />
  </section>
  <section v-else class="editor-empty-state">
    <h1 class="editor-empty-title">打开即记</h1>
    <p class="editor-empty-copy">从左侧新建一条笔记，纯文本和图片都会保存在本机。</p>
  </section>
</template>

<style scoped lang="scss">
.note-editor {
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr) 34px;
  min-block-size: 0;
  block-size: 100%;
}

.note-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  padding: 0 var(--space-24);
  overflow: hidden;
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
  min-inline-size: 0;
}

.note-title-input :deep(.el-input__wrapper) {
  min-block-size: 50px;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.note-title-input :deep(.el-input__inner) {
  min-inline-size: 0;
  block-size: auto;
  color: var(--color-text-primary);
  caret-color: var(--color-accent);
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.25;
}

.note-editor-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.note-editor-body {
  display: grid;
  grid-row: 3;
  grid-template-rows: minmax(0, 1fr);
  min-block-size: 0;
  margin-block-start: var(--space-8);
  overflow: hidden;
  border-block-start: 1px solid var(--color-divider);
}

.note-editor-markdown {
  min-inline-size: 0;
  min-block-size: 0;
}

.note-editor-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  min-block-size: 0;
  gap: 0;
  padding: 20px 30px 0;
  overflow: hidden;
  background: var(--color-canvas);
}

@media (max-width: 900px) {
  .note-editor-header {
    padding-inline: var(--space-16);
  }

  .note-editor-location {
    display: none;
  }

  .note-editor-content {
    padding-inline: var(--space-24);
    padding-block-start: var(--space-32);
  }
}

.editor-empty-state {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--space-12);
  block-size: 100%;
  padding: var(--space-32);
}

.editor-empty-title,
.editor-empty-copy {
  margin: 0;
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
