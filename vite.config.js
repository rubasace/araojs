import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import phoenyx from './phoenyx/vite.js'

const publicHost = process.env.PHOENYX_PUBLIC_HOST

export default defineConfig({
  plugins: [vue(), phoenyx({ snippets: 'src/snippets' })],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // optional public host (e.g. a tunnel) for live preview from another machine
    ...(publicHost && {
      allowedHosts: [publicHost],
      hmr: { clientPort: 443, protocol: 'wss', host: publicHost },
    }),
  },
})
