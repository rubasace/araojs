// Two jobs:
//   npm run build   the library: dist/index.js (ESM) + dist/phoenyx.css + dist/themes/*.css
//   npm run dev     the playground (playground/), a tiny slides project on the library's source
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import phoenyx from './vite/index.js'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const publicHost = process.env.PHOENYX_PUBLIC_HOST
const CSS = 'phoenyx.css'

// The engine reads import.meta.env (DEV, BASE_URL) and import.meta.hot. They belong to the app
// that runs it, not to this build, which would put its own values in (DEV false, base "/", no
// HMR). Hidden from it, and put back in the output: the project's Vite resolves them, in its
// dev server and in its own build.
function keepImportMeta() {
  const used = /\bimport\.meta\.(env|hot)\b/g
  const hidden = /\bimport\.meta\.__phoenyx_(env|hot)\b/g
  return {
    name: 'phoenyx:keep-import-meta',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/node_modules/') || !/\.(js|vue)$/.test(id.split('?')[0])) return null
      return code.replace(used, 'import.meta.__phoenyx_$1')
    },
    renderChunk(code) {
      return { code: code.replace(hidden, 'import.meta.$1'), map: null }
    },
  }
}

// The library's CSS comes with its JS: the entry imports it, so a project needs no import of its
// own (it is built by Vite in any case: the virtual modules require the plugin). The themes are
// copied as they are, one file each, for the project to import the ones its decks wear.
function cssAndThemes() {
  return {
    name: 'phoenyx:css-and-themes',
    generateBundle: {
      order: 'post', // after Vite has put the CSS in the bundle
      handler(_, bundle) {
        const entry = Object.values(bundle).find((f) => f.type === 'chunk' && f.isEntry)
        if (!bundle[CSS]) this.error(`no ${CSS} in the build`)
        entry.code = `import './${CSS}'\n${entry.code}`
        for (const f of readdirSync(here('src/themes')).filter((f) => f.endsWith('.css')))
          this.emitFile({ type: 'asset', fileName: `themes/${f}`, source: readFileSync(here(`src/themes/${f}`), 'utf8') })
      },
    },
  }
}

export default defineConfig(({ command }) => command === 'build'
  ? {
      // the virtual modules stay imports: the project's plugin resolves them
      plugins: [keepImportMeta(), vue(), cssAndThemes()],
      build: {
        outDir: here('dist'),
        emptyOutDir: true,
        copyPublicDir: false,
        minify: false, // a library: the project's build minifies it along with everything else
        lib: { entry: here('src/index.js'), formats: ['es'], fileName: 'index', cssFileName: CSS.replace(/\.css$/, '') },
        rolldownOptions: { external: [/^vue(\/|$)/, /^shiki(\/|$)/, /^virtual:phoenyx\//] },
      },
    }
  : {
      root: here('playground'),
      plugins: [phoenyx()],
      resolve: {
        alias: [
          { find: /^phoenyxjs$/, replacement: here('src/index.js') },
          { find: /^phoenyxjs\/themes\/(.*)$/, replacement: `${here('src/themes')}/$1` },
        ],
      },
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
