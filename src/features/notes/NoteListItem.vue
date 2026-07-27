<script setup lang="ts">
import { StarFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import type { NoteSummary } from '@/types/notes'

const props = defineProps<{
  note: NoteSummary
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const displayTitle = computed(() => {
  const title = props.note.title.trim()
  return title.length > 0 ? title : '无标题笔记'
})

const updatedLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(props.note.updatedAt),
  ),
)
</script>

<template>
  <button
    class="note-list-item"
    :class="{ 'note-list-item--selected': selected }"
    type="button"
    :aria-current="selected ? 'page' : undefined"
    @click="emit('select', note.id)"
  >
    <span class="note-list-item-title-row">
      <span class="note-list-item-title">{{ displayTitle }}</span>
      <el-icon v-if="note.isPinned" class="note-list-item-pin">
        <StarFilled />
      </el-icon>
    </span>
    <span class="note-list-item-preview">{{ note.contentPreview || '尚未记录内容' }}</span>
    <span class="note-list-item-meta">
      <span class="note-list-item-kind">Markdown</span>
      <span class="note-list-item-time">{{ updatedLabel }}</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.note-list-item {
  display: grid;
  gap: var(--space-8);
  inline-size: 100%;
  block-size: 100px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius-8);
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  text-align: start;
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

.note-list-item-title-row,
.note-list-item-meta {
  display: flex;
  align-items: center;
  min-inline-size: 0;
}

.note-list-item-meta {
  justify-content: space-between;
  gap: var(--space-8);
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

.note-list-item-kind,
.note-list-item-time {
  color: var(--color-text-muted);
  font-size: 0.625rem;
}

.note-list-item-kind {
  color: var(--color-accent-active);
}
</style>
