<script setup lang="ts">
import { storeToRefs } from 'pinia'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'
import { useAppStore } from '@/stores/app'

const { snapshot } = storeToRefs(useAppStore())
</script>

<template>
  <WorkspaceLayout :schema-version="snapshot?.schemaVersion ?? 0">
    <section class="workbench-intro">
      <p class="eyebrow">本地优先</p>
      <h1 class="workbench-title">准备开始记录</h1>
      <p class="workbench-copy">本地数据已安全初始化。笔记编辑功能将在下一任务中提供。</p>
    </section>
  </WorkspaceLayout>
</template>

<style scoped lang="scss">
.workbench-intro {
  max-inline-size: 560px;
}

.eyebrow,
.workbench-title,
.workbench-copy {
  margin: 0;
}

.eyebrow {
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.workbench-title {
  margin-block-start: var(--space-12);
  color: var(--color-text-primary);
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.04em;
}

.workbench-copy {
  margin-block-start: var(--space-16);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.7;
}
</style>
