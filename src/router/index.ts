import { createRouter, createWebHashHistory } from 'vue-router'
import WorkbenchView from '@/views/WorkbenchView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'workbench',
      component: WorkbenchView,
    },
  ],
})

export default router
