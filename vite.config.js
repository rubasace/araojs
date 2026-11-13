// Two jobs:
//   npm run build   the library: dist/index.js (ESM) + dist/arao.css
//   npm run dev     the playground (playground/), a tiny slides project on the library's source
import { readdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
      if (id.includes('/node_modules/') || !/\.(ts|js|vue)$/.test(id.split('?')[0])) return null
      return code.replace(used, 'import.meta.__arao_$1')
    },
    renderChunk(code) {
      return { code: code.replace(hidden, 'import.meta.$1'), map: null }
    },
  }
}

// CSS order guard. Where two rules of the same specificity meet on one element, the later one in
// arao.css wins, and the import order in src/plugin.ts is what puts it later (its header says
// why), or, within a component, the order of its style blocks. Each entry: the rule that must come
// first, the rule that must follow it, what breaks otherwise. A rule no longer in arao.css fails
// too, so that the guard cannot go stale unseen.
const CSS_ORDER = [
  ['.ar-snippet', '.ar-zone-image > *', "a Snippet in an image zone takes the zone's flex"],
  [':where(.ar-img)', ':where(.ar-cols, .ar-rows, .ar-grid) > *', 'an Img in Cols, Rows or Grid clips overflow-x like their other children'],
  ['.ar-snippet-line', '[data-ar-slide] *', "the step fade wins over Snippet's own transitions"],
  ['.ar-snippet-tx', '[data-ar-slide] *', "the step fade wins over Snippet's own transitions"],
]
// Rules that must be in arao.css exactly once: the CSS the layout pieces share (layout.css, which
// each links with <style src>). The build keeps one copy as long as every piece links it the same
// way; a second, later copy would beat the pieces' own rules and the order above unseen.
const CSS_ONCE = [':is(.ar-cols, .ar-rows, .ar-grid, .ar-center)']
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const ruleRe = (selector) => new RegExp(`^${escapeRe(selector)} *\\{`, 'gm')
// where the rule with exactly this selector starts (a line of its own in the unminified build)
const ruleAt = (css, selector) => css.search(ruleRe(selector))
function cssOrderError(css) {
  for (const selector of CSS_ONCE) {
    const n = css.match(ruleRe(selector))?.length ?? 0
    if (n !== 1) return `\`${selector} {\` is in ${CSS} ${n} times, not once: every layout piece links layout.css as its first style block, <style src="./layout.css"></style>`
  }
  for (const [first, then, why] of CSS_ORDER) {
    const a = ruleAt(css, first), b = ruleAt(css, then)
    if (a < 0 || b < 0) return `no rule \`${a < 0 ? first : then} {\` in ${CSS}: update CSS_ORDER in vite.config.js`
    if (a > b) return `\`${first}\` must come before \`${then}\` in ${CSS} (${why}): fix the import order in src/plugin.ts (or a component's style blocks)`
  }
  return null
}

// The project's themes go after all of the engine's CSS, so that a theme's rule wins over an
// engine rule of the same specificity: in the project's build, CSS is in import order, and the
// entry imports ./arao.css first and virtual:arao/theme-styles (the theme sources' CSS) last. The
// bundler hoists every import to the top of the chunk, in the order the modules run (src/index.ts
// imports the themes last for that): the theme styles must be the last import, after ./arao.css.
const THEME_STYLES = 'virtual:arao/theme-styles'
function themeStylesError(code) {
  const imports = [...code.matchAll(/^import\s+(?:[\w$*{}\s,]+\s+from\s+)?["']([^"']+)["']/gm)].map((m) => m[1])
  const at = imports.indexOf(THEME_STYLES)
  if (at < 0) return `no import of ${THEME_STYLES} in the entry`
  if (at !== imports.length - 1) return `${THEME_STYLES} must be the entry's last import, not before ${imports.slice(at + 1).join(', ')}`
  if (!imports.slice(0, at).includes(`./${CSS}`)) return `./${CSS} must be imported before ${THEME_STYLES}`
  return null
}

// The library's CSS comes with its JS: the entry imports it, so a project needs no import of its
// own (it is built by Vite in any case: the virtual modules require the plugin). The themes are
// not in it: the built-in ones (themes/ at the package's root) and the project's are theme
// sources, loaded by the plugin, after it (themeStylesError above).
function css() {
  return {
    name: 'arao:css',
    generateBundle: {
      order: 'post', // after Vite has put the CSS in the bundle
      handler(_, bundle) {
        const entry = Object.values(bundle).find((f) => f.type === 'chunk' && f.isEntry)
        if (!bundle[CSS]) this.error(`no ${CSS} in the build`)
        const { source } = bundle[CSS]
        const order = cssOrderError(typeof source === 'string' ? source : new TextDecoder().decode(source))
        if (order) this.error(`CSS order: ${order}`)
        entry.code = `import './${CSS}'\n${entry.code}`
        const themes = themeStylesError(entry.code)
        if (themes) this.error(`theme styles: ${themes}: keep their import last in src/index.ts`)
      },
    },
  }
}

// The engine's UI text: one catalogue per language in src/i18n/, each with exactly the keys of
// English (en.ts, what a missing key would fall back to unseen), each a string where English has
// a string and a function where it has one (a message that takes values).
const I18N = here('src/i18n/')
async function catalogueError() {
  const files = (await readdir(I18N)).filter((f) => f.endsWith('.ts') && f !== 'i18n.ts')
  // Node strips the catalogues' types itself (22.18 or newer)
  const load = async (f) => {
    try {
      return (await import(pathToFileURL(I18N + f).href)).default
    } catch (e) {
      throw new Error(`cannot load src/i18n/${f} (building the library needs Node 22.18 or newer, which runs TypeScript): ${e.message}`)
    }
  }
  const en = await load('en.ts')
  for (const f of files) {
    const other = await load(f)
    const missing = Object.keys(en).filter((k) => !(k in other))
    const extra = Object.keys(other).filter((k) => !(k in en))
    const kind = Object.keys(en).filter((k) => k in other && typeof other[k] !== typeof en[k])
    if (missing.length) return `${f} has no ${missing.join(', ')}`
    if (extra.length) return `${f} has keys English has not: ${extra.join(', ')}`
    if (kind.length) return `${f}: ${kind.join(', ')} must be a ${kind.map((k) => typeof en[k]).join(', ')}, as in en.ts`
  }
  return null
}
function catalogues() {
  return {
    name: 'arao:catalogues',
    async buildStart() {
      const error = await catalogueError()
      if (error) this.error(`UI text: ${error} (src/i18n/)`)
    },
  }
}

export default defineConfig(({ command }) => command === 'build'
  ? {
      // the virtual modules stay imports: the project's plugin resolves them
      plugins: [keepImportMeta(), vue(), css(), catalogues()],
      build: {
        outDir: here('dist'),
        emptyOutDir: true,
        copyPublicDir: false,
        minify: false, // a library: the project's build minifies it along with everything else
        lib: { entry: here('src/index.ts'), formats: ['es'], fileName: 'index', cssFileName: CSS.replace(/\.css$/, '') },
        // dependencies stay imports, resolved in the project: vue (a peer), VueUse, Shiki
        rolldownOptions: { external: [/^vue(\/|$)/, /^@vueuse\//, /^shiki(\/|$)/, /^virtual:arao\//] },
      },
    }
  : {
      root: here('playground'),
      plugins: [arao()],
      resolve: {
        alias: [{ find: /^araojs$/, replacement: here('src/index.ts') }],
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
