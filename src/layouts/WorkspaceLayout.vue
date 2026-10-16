<script setup lang="ts">
import { shallowRef } from 'vue'
import AppSidebar from './AppSidebar.vue'
import type { CategoryNode } from '@/types/categories'

defineProps<{
  categories: CategoryNode[]
  tagCount?: number
  noteDropEnabled?: boolean
}>()

const emit = defineEmits<{
  create: [categoryId?: string]
  moveNote: [noteId: string, categoryId: string | undefined]
}>()

const noteListWidth = shallowRef<number | string>(340)
</script>

<template>
  <main class="workspace-layout">
    <aside class="sidebar">
      <AppSidebar
        :categories="categories"
        :tag-count="tagCount"
        :note-drop-enabled="noteDropEnabled"
        @create="emit('create', $event)"
        @move-note="(noteId, categoryId) => emit('moveNote', noteId, categoryId)"
      />
    </aside>
    <el-splitter class="workspace-panels" layout="horizontal">
      <el-splitter-panel v-model:size="noteListWidth" class="note-list-panel" :min="280">
        <slot name="list" />
      </el-splitter-panel>
      <el-splitter-panel class="editor-panel" :min="360">
        <slot name="editor" />
      </el-splitter-panel>
    </el-splitter>
  </main>
</template>

<style scoped lang="scss">
.workspace-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
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

.workspace-panels {
  min-inline-size: 0;
  min-block-size: 0;
  overflow: hidden;
}

@media (max-width: 1100px) {
  .workspace-layout {
    grid-template-columns: 72px minmax(0, 1fr);
  }
}
</style>
