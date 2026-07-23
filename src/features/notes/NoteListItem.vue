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
  gap: var(--space-4);
  inline-size: 100%;
  padding: var(--space-12) var(--space-16);
  overflow: hidden;
  border: 0;
  border-block-end: 1px solid var(--color-border);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: start;
}

.note-list-item:hover,
.note-list-item--selected {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.note-list-item-title,
.note-list-item-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-list-item-title {
  color: var(--color-text-primary);
  font-weight: 600;
}

.note-list-item-preview,
.note-list-item-time {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
