<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AppBootstrap from './app/AppBootstrap.vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()
const { status } = storeToRefs(appStore)
</script>

<template>
  <AppBootstrap v-if="status !== 'ready'" />
  <RouterView v-else />
</template>
