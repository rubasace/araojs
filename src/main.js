import { createApp } from 'vue'
import Phoenyx from './engine'
import './themes/layouts.css'
import './themes/default.css'
import './themes/vigojug.css'
import App from './App.vue'

createApp(App).use(Phoenyx).mount('#app')
