// The playground is set up like any slides project; only vite.config.js points 'araojs' at
// the library's source instead of its build. Its themes are the CSS files in src/themes: the
// plugin loads them, nothing to import.
import { createDeckApp } from 'araojs'

createDeckApp().mount('#app')
