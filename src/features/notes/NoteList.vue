<script setup lang="ts">
import NoteListItem from './NoteListItem.vue'
import type { NoteSummary } from '@/types/notes'

defineProps<{
  notes: NoteSummary[]
  selectedId?: string
  loading: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  retry: []
  select: [id: string]
}>()
</script>

<template>
  <section class="note-list">
    <header class="note-list-header">
      <div>
        <p class="note-list-eyebrow">全部笔记</p>
        <h1 class="note-list-title">快速记录</h1>
      </div>
      <el-button type="primary" @click="emit('create')">新建笔记</el-button>
    </header>

    <div v-if="loading" class="note-list-empty">正在加载笔记…</div>
    <div v-else-if="error" class="note-list-empty" role="alert">
      <p class="note-list-empty-title">无法读取笔记</p>
      <p class="note-list-empty-copy">{{ error }}</p>
      <el-button type="primary" @click="emit('retry')">重试</el-button>
    </div>
    <div v-else-if="notes.length === 0" class="note-list-empty">
      <p class="note-list-empty-title">从一条笔记开始</p>
      <p class="note-list-empty-copy">点击“新建笔记”，内容会自动保存在本机。</p>
      <el-button type="primary" @click="emit('create')">新建第一条笔记</el-button>
    </div>
    <div v-else class="note-list-items">
      <NoteListItem
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :selected="note.id === selectedId"
        @select="emit('select', $event)"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.note-list {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-block-size: 0;
}

.note-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-20) var(--space-16);
  border-block-end: 1px solid var(--color-border);
}

.note-list-eyebrow,
.note-list-title,
.note-list-empty-title,
.note-list-empty-copy {
  margin: 0;
}

.note-list-eyebrow {
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.note-list-title {
  margin-block-start: var(--space-4);
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.note-list-items {
  overflow: auto;
}

.note-list-empty {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--space-12);
  padding: var(--space-24);
}

.note-list-empty-title {
  color: var(--color-text-primary);
  font-weight: 600;
}

.note-list-empty-copy {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
