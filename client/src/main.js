import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import router from './router'

// 全局样式
import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/main.css'
import './assets/css/glass.css'
import './assets/css/experience.css'
import './assets/css/animations.css'

// 磁性交互指令（v-magnetic）：自身带环境判定，不满足时是无害 no-op
import { magnetic } from './assets/js/magnetic'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(head)
app.directive('magnetic', magnetic)

app.mount('#app')
