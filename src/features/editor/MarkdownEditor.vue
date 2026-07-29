<script setup lang="ts">
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useClipboardPaste } from './useClipboardPaste'

const props = defineProps<{
  modelValue: string
  saveImage: (bytes: Uint8Array) => Promise<string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  pasteError: [message: string]
}>()

const editorHost = useTemplateRef<HTMLDivElement>('editorHost')
const editorView = shallowRef<EditorView>()
let synchronizing = false
let applyingHistory = false
const undoStack: string[] = []
const redoStack: string[] = []

function insertText(text: string): void {
  const view = editorView.value
  if (view === undefined || text.length === 0) {
    return
  }
  const selection = view.state.selection.main
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: text },
    selection: { anchor: selection.from + text.length },
  })
  view.focus()
}

function insertNewLine(): boolean {
  insertText('\n')
  return true
}

const { handlePaste } = useClipboardPaste({
  insertText,
  saveImage: props.saveImage,
  onError: (message) => emit('pasteError', message),
})

function handlePasteEvent(event: ClipboardEvent): boolean {
  void handlePaste(event)
  return true
}

function focusEditorWhenClickingBlankArea(event: MouseEvent): void {
  const view = editorView.value
  if (event.button !== 0 || view === undefined || !(event.target instanceof Node)) {
    return
  }
  if (view.contentDOM.contains(event.target)) {
    return
  }
  view.dispatch({ selection: { anchor: view.state.doc.length } })
  view.focus()
}

function applyHistory(nextValue: string): void {
  const view = editorView.value
  if (view === undefined) {
    return
  }
  applyingHistory = true
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nextValue } })
  applyingHistory = false
}

function undo(): boolean {
  const previousValue = undoStack.pop()
  const view = editorView.value
  if (previousValue === undefined || view === undefined) {
    return false
  }
  redoStack.push(view.state.doc.toString())
  applyHistory(previousValue)
  return true
}

function redo(): boolean {
  const nextValue = redoStack.pop()
  const view = editorView.value
  if (nextValue === undefined || view === undefined) {
    return false
  }
  undoStack.push(view.state.doc.toString())
  applyHistory(nextValue)
  return true
}

function focus(): void {
  editorView.value?.focus()
}

defineExpose({ focus })

onMounted(() => {
  const host = editorHost.value
  if (host === null) {
    return
  }
  const view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        EditorView.lineWrapping,
        EditorView.domEventHandlers({
          paste: handlePasteEvent,
        }),
        keymap.of([
          {
            key: 'Enter',
            run: insertNewLine,
          },
          {
            key: 'Mod-z',
            run: undo,
          },
          {
            key: 'Mod-Shift-z',
            run: redo,
          },
          {
            key: 'Mod-y',
            run: redo,
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !synchronizing) {
            if (!applyingHistory) {
              undoStack.push(update.startState.doc.toString())
              redoStack.length = 0
            }
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
      ],
    }),
    parent: host,
  })
  host.addEventListener('mousedown', focusEditorWhenClickingBlankArea)
  editorView.value = view
})

watch(
  () => props.modelValue,
  (value) => {
    const view = editorView.value
    if (view === undefined || view.state.doc.toString() === value) {
      return
    }
    synchronizing = true
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    synchronizing = false
  },
)

onBeforeUnmount(() => {
  editorHost.value?.removeEventListener('mousedown', focusEditorWhenClickingBlankArea)
  editorView.value?.destroy()
})
</script>

<template>
  <div ref="editorHost" class="markdown-editor"></div>
</template>

<style scoped lang="scss">
.markdown-editor {
  min-inline-size: 0;
  min-block-size: 0;
  block-size: 100%;
  overflow: hidden;
  color: var(--color-text-primary);
  font-family: 'Geist Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: var(--editor-font-size);
  line-height: 1.8;
}

.markdown-editor :deep(.cm-editor) {
  min-inline-size: 0;
  min-block-size: 0;
  block-size: 100%;
  outline: none;
}

.markdown-editor :deep(.cm-scroller) {
  min-inline-size: 0;
  block-size: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: rgb(144 147 153 / 30%) transparent;
  scrollbar-width: thin;
  font-family: inherit;
}

.markdown-editor :deep(.cm-content) {
  min-inline-size: 0;
  min-block-size: 100%;
  padding: var(--space-16) 0 var(--space-24);
  caret-color: var(--color-accent);
}

.markdown-editor :deep(.cm-scroller::-webkit-scrollbar) {
  inline-size: 6px;
  block-size: 6px;
}

.markdown-editor :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: transparent;
}

.markdown-editor :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgb(144 147 153 / 30%);
}

.markdown-editor :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: rgb(144 147 153 / 50%);
}

.markdown-editor :deep(.cm-focused) {
  outline: none;
}
</style>
