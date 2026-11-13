// Two jobs:
//   npm run build   the library: dist/index.js (ESM) + dist/arao.css + dist/themes/*.css
//   npm run dev     the playground (playground/), a tiny slides project on the library's source
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import arao from './vite/index.js'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const publicHost = process.env.ARAO_PUBLIC_HOST
const CSS = 'arao.css'

// The engine reads import.meta.env (DEV, BASE_URL) and import.meta.hot. They belong to the app
// that runs it, not to this build, which would put its own values in (DEV false, base "/", no
// HMR). Hidden from it, and put back in the output: the project's Vite resolves them, in its
// dev server and in its own build.
function keepImportMeta() {
  const used = /\bimport\.meta\.(env|hot)\b/g
  const hidden = /\bimport\.meta\.__arao_(env|hot)\b/g
  return {
    name: 'arao:keep-import-meta',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/node_modules/') || !/\.(js|vue)$/.test(id.split('?')[0])) return null
      return code.replace(used, 'import.meta.__arao_$1')
    },
    renderChunk(code) {
      return { code: code.replace(hidden, 'import.meta.$1'), map: null }
    },
  }
}

// CSS order guard. Where two rules of the same specificity meet on one element, the later one in
// arao.css wins, and the import order in src/plugin.js is what puts it later (its header says
// why). Each entry: the rule that must come first, the rule that must follow it, what breaks
// otherwise. A rule no longer in arao.css fails too, so that the guard cannot go stale unseen.
const CSS_ORDER = [
  ['.ar-snippet', '.ar-zone-image > *', "a Snippet in an image zone takes the zone's flex"],
  [':where(.ar-img)', ':where(.ar-cols) > *', 'an Img in Cols clips overflow-x like its other children'],
  ['.ar-snippet-line', '[data-ar-slide] *', "the step fade wins over Snippet's own transitions"],
  ['.ar-snippet-tx', '[data-ar-slide] *', "the step fade wins over Snippet's own transitions"],
]
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// where the rule with exactly this selector starts (a line of its own in the unminified build)
const ruleAt = (css, selector) => css.search(new RegExp(`^${escapeRe(selector)} *\\{`, 'm'))
function cssOrderError(css) {
  for (const [first, then, why] of CSS_ORDER) {
    const a = ruleAt(css, first), b = ruleAt(css, then)
    if (a < 0 || b < 0) return `no rule \`${a < 0 ? first : then} {\` in ${CSS}: update CSS_ORDER in vite.config.js`
    if (a > b) return `\`${first}\` must come before \`${then}\` in ${CSS} (${why}): fix the import order in src/plugin.js`
  }
  return null
}

// The library's CSS comes with its JS: the entry imports it, so a project needs no import of its
// own (it is built by Vite in any case: the virtual modules require the plugin). The themes are
// copied as they are, one file each, for the project to import the ones its decks wear.
function cssAndThemes() {
  return {
    name: 'arao:css-and-themes',
    generateBundle: {
      order: 'post', // after Vite has put the CSS in the bundle
      handler(_, bundle) {
        const entry = Object.values(bundle).find((f) => f.type === 'chunk' && f.isEntry)
        if (!bundle[CSS]) this.error(`no ${CSS} in the build`)
        const { source } = bundle[CSS]
        const order = cssOrderError(typeof source === 'string' ? source : new TextDecoder().decode(source))
        if (order) this.error(`CSS order: ${order}`)
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
        // dependencies stay imports, resolved in the project: vue (a peer), VueUse, Shiki
        rolldownOptions: { external: [/^vue(\/|$)/, /^@vueuse\//, /^shiki(\/|$)/, /^virtual:arao\//] },
      },
    }
  : {
      root: here('playground'),
      plugins: [arao()],
      resolve: {
        alias: [
          { find: /^araojs$/, replacement: here('src/index.js') },
          { find: /^araojs\/themes\/(.*)$/, replacement: `${here('src/themes')}/$1` },
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
