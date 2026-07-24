<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
}>()

const wordCount = computed(() => countWords(props.content))
const characterCount = computed(() => Array.from(props.content.replace(/\s/g, '')).length)
const lineCount = computed(() =>
  props.content === '' ? 1 : props.content.split(/\r\n|\r|\n/).length,
)

function countWords(content: string): number {
  const cjkCharacterCount = (content.match(/[\u3400-\u9fff]/g) ?? []).length
  const latinWordCount =
    content.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length ?? 0

  return cjkCharacterCount + latinWordCount
}
</script>

<template>
  <footer class="editor-status-bar" aria-label="文档统计">
    <div class="editor-status-bar__statistics">
      <span>字数 {{ wordCount }}</span>
      <span>字符 {{ characterCount }}</span>
      <span>行 {{ lineCount }}</span>
    </div>
    <span class="editor-status-bar__language">Markdown</span>
  </footer>
</template>

<style scoped lang="scss">
.editor-status-bar,
.editor-status-bar__statistics {
  display: flex;
  align-items: center;
}

.editor-status-bar {
  justify-content: space-between;
  min-inline-size: 0;
  min-block-size: 34px;
  gap: var(--space-16);
  padding: 0 var(--space-24);
  border-block-start: 1px solid var(--color-divider);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-family: 'Geist Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 0.625rem;
}

.editor-status-bar__statistics {
  min-inline-size: 0;
  gap: var(--space-12);
  overflow: hidden;
  white-space: nowrap;
}

.editor-status-bar__language {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
}
</style>
