import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/es/components/message/style/index'
import 'element-plus/es/components/message-box/style/index'
import App from './App.vue'
import router from './router'
import './styles/global.scss'

createApp(App).use(createPinia()).use(router).mount('#app')
