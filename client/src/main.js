import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'

// 全局样式
import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/main.css'
import './assets/css/glass.css'
import './assets/css/animations.css'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(head)

app.mount('#app')
