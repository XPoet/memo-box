<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import type { CategoryNode } from '@/types/categories'

defineProps<{
  title: string
  description: string
  categories: CategoryNode[]
  tagCount?: number
  trashCount?: number
  showCategoryCounts?: boolean
}>()

const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <main class="management-layout">
    <aside class="management-sidebar">
      <AppSidebar
        :categories="categories"
        :tag-count="tagCount"
        :trash-count="trashCount"
        :show-category-counts="showCategoryCounts"
        @create="emit('create')"
      />
    </aside>
    <section class="management-main">
      <header class="management-header">
        <div>
          <h1 class="management-title">{{ title }}</h1>
          <p class="management-description">{{ description }}</p>
        </div>
        <div class="management-header-action">
          <slot name="action" />
        </div>
      </header>
      <el-scrollbar class="management-content">
        <section class="management-content-view">
          <slot />
        </section>
      </el-scrollbar>
    </section>
  </main>
</template>

<style scoped lang="scss">
.management-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  block-size: 100dvh;
  min-block-size: 0;
  overflow: hidden;
  background: var(--color-canvas);
}

.management-sidebar {
  min-block-size: 0;
  overflow: hidden;
  border-inline-end: 1px solid var(--color-divider);
}

.management-main {
  display: grid;
  grid-template-rows: 100px minmax(0, 1fr);
  min-inline-size: 0;
  min-block-size: 0;
}

.management-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-24);
  padding: 0 36px;
  border-block-end: 1px solid var(--color-divider);
  background: var(--color-surface);
}

.management-title,
.management-description {
  margin: 0;
}

.management-title {
  color: var(--color-text-primary);
  font-size: 1.375rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.management-description {
  margin-block-start: 7px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.management-header-action {
  flex: 0 0 auto;
}

.management-content {
  min-block-size: 0;
}

.management-content-view {
  box-sizing: border-box;
  min-block-size: 100%;
  padding: 20px 36px;
}

@media (max-width: 1400px) {
  .management-layout {
    grid-template-columns: 210px minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .management-layout {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .management-header {
    padding-inline: var(--space-24);
  }

  .management-content-view {
    padding-inline: var(--space-24);
  }
}
</style>
