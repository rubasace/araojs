// The plugin writes the project's layouts' declaration file (src/arao-layouts.d.ts) when a build
// starts: the smallest build there is, of an entry that imports nothing, written nowhere.
import { defineConfig } from 'vite'
import arao from 'araojs/vite'

export default defineConfig({
  logLevel: 'warn',
  plugins: [arao()],
  build: { lib: { entry: 'entry.js', formats: ['es'] }, write: false },
})
