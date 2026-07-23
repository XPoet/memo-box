<script setup lang="ts">
import { Filter, Search, Sort } from '@element-plus/icons-vue'
import { computed, shallowRef } from 'vue'
import NoteListItem from './NoteListItem.vue'
import type { NoteSummary } from '@/types/notes'

const props = defineProps<{
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

const query = shallowRef('')
const visibleNotes = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  if (keyword === '') {
    return props.notes
  }
  return props.notes.filter((note) =>
    `${note.title}\n${note.contentPreview}`.toLocaleLowerCase().includes(keyword),
  )
})
</script>

<template>
  <section class="note-list">
    <header class="note-list-header">
      <div class="note-list-heading">
        <h1 class="note-list-title">全部笔记</h1>
        <span class="note-list-count">{{ notes.length }}</span>
      </div>
      <div class="note-list-actions" aria-label="列表工具">
        <el-button text circle disabled aria-label="筛选笔记">
          <el-icon><Filter /></el-icon>
        </el-button>
        <el-button text circle disabled aria-label="排序笔记">
          <el-icon><Sort /></el-icon>
        </el-button>
      </div>
      <el-input
        v-model="query"
        class="note-list-search"
        placeholder="搜索笔记"
        aria-label="搜索笔记"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
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
    <div v-else-if="visibleNotes.length === 0" class="note-list-empty">
      <p class="note-list-empty-title">没有匹配的笔记</p>
      <p class="note-list-empty-copy">换一个关键词，或清空当前搜索。</p>
    </div>
    <div v-else class="note-list-items">
      <NoteListItem
        v-for="note in visibleNotes"
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-16);
  border-block-end: 1px solid var(--color-divider);
}

.note-list-title,
.note-list-empty-title,
.note-list-empty-copy {
  margin: 0;
}

.note-list-heading,
.note-list-actions {
  display: flex;
  align-items: center;
}

.note-list-title {
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 650;
}

.note-list-count {
  margin-inline-start: 7px;
  color: var(--color-text-muted);
  font-family: 'Geist Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 0.6875rem;
}

.note-list-actions {
  gap: 2px;
}

.note-list-search {
  grid-column: 1 / -1;
}

.note-list-search :deep(.el-input__wrapper) {
  min-block-size: 38px;
  background: var(--color-canvas);
  box-shadow: 0 0 0 1px var(--color-border) inset;
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
