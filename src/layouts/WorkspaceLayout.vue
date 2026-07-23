<script setup lang="ts">
defineProps<{
  schemaVersion: number
}>()
</script>

<template>
  <main class="workspace-layout">
    <aside class="sidebar" aria-label="主导航">
      <p class="brand">MemoBox</p>
      <p class="brand-subtitle">本地 Markdown 笔记</p>
      <slot name="navigation" />
    </aside>
    <section class="note-list-panel" aria-label="笔记列表">
      <slot name="list" />
    </section>
    <section class="editor-panel" aria-label="笔记编辑器">
      <slot name="editor" />
      <p class="schema-version">本地数据结构 V{{ schemaVersion.toString().padStart(3, '0') }}</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.workspace-layout {
  display: grid;
  grid-template-columns: 240px 340px minmax(0, 1fr);
  min-block-size: 100vh;
  background: var(--color-canvas);
}

.sidebar {
  padding: var(--space-24);
  border-inline-end: 1px solid var(--color-border);
  background: var(--color-sidebar);
}

.brand,
.brand-subtitle,
.schema-version {
  margin: 0;
}

.brand {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.brand-subtitle,
.schema-version {
  margin-block-start: var(--space-8);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.note-list-panel,
.editor-panel {
  display: grid;
  min-inline-size: 0;
}

.note-list-panel {
  border-inline-end: 1px solid var(--color-border);
  background: var(--color-surface);
}

.editor-panel {
  grid-template-rows: minmax(0, 1fr) auto;
}

.schema-version {
  padding: var(--space-8) var(--space-16);
  border-block-start: 1px solid var(--color-border);
  background: var(--color-surface);
}

@media (max-width: 960px) {
  .workspace-layout {
    grid-template-columns: 72px minmax(280px, 320px) minmax(0, 1fr);
  }

  .sidebar {
    padding-inline: var(--space-16);
  }

  .brand-subtitle {
    display: none;
  }
}
</style>
