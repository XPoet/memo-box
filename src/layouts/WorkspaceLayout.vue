<script setup lang="ts">
defineProps<{
  schemaVersion: number
}>()
</script>

<template>
  <main class="workspace-layout">
    <aside class="sidebar">
      <p class="brand">MemoBox</p>
      <p class="brand-subtitle">本地 Markdown 笔记</p>
    </aside>
    <section class="workspace-content">
      <slot />
      <p class="schema-version">本地数据结构 V{{ schemaVersion.toString().padStart(3, '0') }}</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.workspace-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
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

.workspace-content {
  display: grid;
  align-content: center;
  gap: var(--space-24);
  padding: var(--space-32);
}

@media (max-width: 960px) {
  .workspace-layout {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .sidebar {
    padding-inline: var(--space-16);
  }

  .brand-subtitle {
    display: none;
  }
}
</style>
