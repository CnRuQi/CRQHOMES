import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 全局样式
import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/main.css'
import './assets/css/glass.css'
import './assets/css/animations.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
