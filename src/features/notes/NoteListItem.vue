<script setup lang="ts">
import { Calendar, Clock, StarFilled } from '@element-plus/icons-vue'
import { computed, shallowRef } from 'vue'
import { NOTE_DRAG_TYPE, type NoteSummary } from '@/types/notes'

const props = defineProps<{
  note: NoteSummary
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const isDragging = shallowRef(false)

function startDrag(event: DragEvent): void {
  if (event.dataTransfer === null) return
  event.dataTransfer.setData(NOTE_DRAG_TYPE, props.note.id)
  event.dataTransfer.effectAllowed = 'move'
  isDragging.value = true
}

const displayTitle = computed(() => {
  const title = props.note.title.trim()
  return title.length > 0 ? title : '无标题笔记'
})

const timestampFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const createdLabel = computed(() => timestampFormatter.format(new Date(props.note.createdAt)))
const updatedLabel = computed(() => timestampFormatter.format(new Date(props.note.updatedAt)))
</script>

<template>
  <button
    class="note-list-item"
    :class="{ 'note-list-item--selected': selected, 'note-list-item--dragging': isDragging }"
    type="button"
    draggable="true"
    title="拖动到左侧分类以移动笔记"
    :aria-current="selected ? 'page' : undefined"
    @click="emit('select', note.id)"
    @dragstart="startDrag"
    @dragend="isDragging = false"
  >
    <span class="note-list-item-title-row">
      <span class="note-list-item-title">{{ displayTitle }}</span>
      <el-icon v-if="note.isPinned" class="note-list-item-pin">
        <StarFilled />
      </el-icon>
    </span>
    <span class="note-list-item-preview">{{ note.contentPreview || '尚未记录内容' }}</span>
    <span class="note-list-item-tags">{{ note.tagNames.map((x) => `#${x}`).join(' ') || '' }}</span>
    <span class="note-list-item-times">
      <span class="note-list-item-time" :title="`创建时间：${createdLabel}`">
        <el-icon aria-hidden="true"><Calendar /></el-icon>
        <time :datetime="note.createdAt">{{ createdLabel }}</time>
      </span>
      <span class="note-list-item-time" :title="`更新时间：${updatedLabel}`">
        <el-icon aria-hidden="true"><Clock /></el-icon>
        <time :datetime="note.updatedAt">{{ updatedLabel }}</time>
      </span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.note-list-item {
  display: grid;
  grid-template-rows: 18px 18px 14px 36px;
  gap: var(--space-8);
  inline-size: 100%;
  block-size: 140px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius-8);
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  text-align: start;
  user-select: none;
}

.note-list-item--dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.note-list-item:hover,
.note-list-item--selected {
  background: var(--color-accent-soft);
}

.note-list-item:hover {
  border-color: color-mix(in srgb, var(--color-accent) 18%, var(--color-border));
}

.note-list-item--selected {
  border-color: var(--color-accent);
}

.note-list-item-title-row {
  display: flex;
  align-items: center;
  min-inline-size: 0;
}

.note-list-item-title-row {
  gap: var(--space-8);
}

.note-list-item-title,
.note-list-item-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-list-item-title {
  min-inline-size: 0;
  flex: 1 1 auto;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
}

.note-list-item-pin {
  flex: 0 0 auto;
  color: var(--color-accent);
  font-size: 0.875rem;
}

.note-list-item-preview {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

.note-list-item-tags {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-accent-active);
  font-size: 0.625rem;
}

.note-list-item-times {
  display: flex;
  justify-content: space-between;
}

.note-list-item-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  line-height: 16px;
  white-space: nowrap;
}

.note-list-item-time .el-icon {
  flex: 0 0 auto;
  font-size: 0.75rem;
}

.note-list-item-time time {
  font-variant-numeric: tabular-nums;
}
</style>
