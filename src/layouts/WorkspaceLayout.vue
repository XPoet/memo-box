<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import type { CategoryNode } from '@/types/categories'

defineProps<{
  categories: CategoryNode[]
  tagCount?: number
  showCategoryCounts?: boolean
}>()

const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <main class="workspace-layout">
    <aside class="sidebar">
      <AppSidebar
        :categories="categories"
        :tag-count="tagCount"
        :show-category-counts="showCategoryCounts"
        @create="emit('create')"
      />
    </aside>
    <section class="note-list-panel">
      <slot name="list" />
    </section>
    <section class="editor-panel">
      <slot name="editor" />
    </section>
  </main>
</template>

<style scoped lang="scss">
.workspace-layout {
  display: grid;
  grid-template-columns: 240px 340px minmax(0, 1fr);
  block-size: 100dvh;
  min-block-size: 0;
  overflow: hidden;
  background: var(--color-canvas);
}

.sidebar {
  min-block-size: 0;
  overflow: hidden;
  border-inline-end: 1px solid var(--color-divider);
}

.note-list-panel,
.editor-panel {
  display: grid;
  min-inline-size: 0;
  min-block-size: 0;
  overflow: hidden;
}

.note-list-panel {
  border-inline-end: 1px solid var(--color-border);
  background: var(--color-surface);
}

@media (max-width: 1400px) {
  .workspace-layout {
    grid-template-columns: 210px 320px minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .workspace-layout {
    grid-template-columns: 72px minmax(280px, 320px) minmax(0, 1fr);
  }
}
</style>
