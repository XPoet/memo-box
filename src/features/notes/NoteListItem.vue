<script setup lang="ts">
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
    <span class="note-list-item-title">{{ displayTitle }}</span>
    <span class="note-list-item-preview">{{ note.contentPreview || '尚未记录内容' }}</span>
    <span class="note-list-item-time">{{ updatedLabel }}</span>
  </button>
</template>

<style scoped lang="scss">
.note-list-item {
  display: grid;
  gap: var(--space-8);
  inline-size: 100%;
  min-block-size: 88px;
  padding: 14px;
  overflow: hidden;
  border: 0 solid var(--color-divider);
  border-block-end-width: 1px;
  border-inline-start-width: 3px;
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  text-align: start;
}

.note-list-item:hover,
.note-list-item--selected {
  background: var(--color-accent-soft);
}

.note-list-item--selected {
  border-inline-start-color: var(--color-accent);
}

.note-list-item-title,
.note-list-item-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-list-item-title {
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 600;
}

.note-list-item-preview,
.note-list-item-time {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.note-list-item-time {
  color: var(--color-text-muted);
  font-size: 0.625rem;
}
</style>
