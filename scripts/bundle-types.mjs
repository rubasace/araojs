// The public types, one self-contained file per entry: dist/types/index.d.ts ('araojs') and
// dist/types/vite.d.ts ('araojs/vite'). `npm run build` runs it after vue-tsc has emitted the
// declarations of every module into dist/types-tmp (tsconfig.build.json).
// One file, so a consumer resolves it whatever its moduleResolution (bundler, node16, nodenext):
// no relative imports without an extension, no imports of .vue files. What the engine imports
// for its side effects (its CSS, the layouts and themes through virtual:arao/layout-styles and
// virtual:arao/theme-styles) is
// dropped: those modules exist only in the library's build and in a project with the Vite plugin.
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rollup } from 'rollup'
import { dts } from 'rollup-plugin-dts'
import { camelize, layoutParams } from '../vite/layout-params.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = resolve(root, 'dist/types-tmp')
const out = resolve(root, 'dist/types')
const ENTRIES = { index: 'src/index.d.ts', vite: 'vite/public.d.ts' }
// 'araojs/vite': the plugin, as the default and as a named export (vite/index.js exports both;
// tsc keeps only the default), and its options. Its other JSDoc typedefs are internal.
const VITE_PUBLIC = `import arao from './index'
export default arao
export { arao }
export type { AraoOptions } from './index'
`

// side-effect-only imports of the engine: an empty module, so nothing of them reaches the types
const SIDE_EFFECTS = /^virtual:arao\/(?:layout|theme)-styles$|\.css$/
const dropSideEffects = {
  name: 'arao-drop-side-effects',
  resolveId: (id) => (SIDE_EFFECTS.test(id) ? `\0empty:${id}` : null),
  load: (id) => (id.startsWith('\0empty:') ? 'export {}' : null),
}
// './components/Deck.vue' → the declaration vue-tsc emitted beside it, Deck.vue.d.ts
const vueDeclarations = {
  name: 'arao-vue-declarations',
  resolveId(id, importer) {
    if (!importer || !id.startsWith('.') || !id.endsWith('.vue')) return null
    const file = resolve(dirname(importer), `${id}.d.ts`)
    return existsSync(file) ? file : null
  },
}

await rm(out, { recursive: true, force: true })
await writeFile(resolve(tmp, 'vite/public.d.ts'), VITE_PUBLIC)
for (const [name, entry] of Object.entries(ENTRIES)) {
  const bundle = await rollup({
    input: resolve(tmp, entry),
    plugins: [dropSideEffects, vueDeclarations, dts({ respectExternal: false })],
    // packages stay imports: the consumer has them (vue, vite and @vitejs/plugin-vue are peers or
    // dependencies of araojs)
    external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
    onwarn(warning, warn) {
      if (warning.code === 'EMPTY_BUNDLE') return
      warn(warning)
    },
  })
  await bundle.write({ file: resolve(out, `${name}.d.ts`), format: 'es' })
  await bundle.close()
}
await rm(tmp, { recursive: true, force: true })

// what a consumer could not resolve must not be in them: a relative import, a .vue or .css file,
// a virtual module
const UNRESOLVABLE = /from\s+['"](\.|[^'"]*\.vue['"]|[^'"]*\.css['"]|virtual:)|import\s+['"](\.|[^'"]*\.(vue|css)['"]|virtual:)/
for (const name of Object.keys(ENTRIES)) {
  const text = await readFile(resolve(out, `${name}.d.ts`), 'utf8')
  const bad = text.split('\n').map((line, i) => [i + 1, line]).filter(([, line]) => UNRESOLVABLE.test(line))
  if (bad.length) {
    console.error(`[arao] dist/types/${name}.d.ts imports what a consumer cannot resolve:\n${bad.map(([n, l]) => `  ${n}: ${l.trim()}`).join('\n')}`)
    process.exit(1)
  }
}

// LibraryLayouts (src/components/library-layouts.ts, which SlideLayouts is made of), the layouts
// Slide's layout accepts in a typed template and the attributes each takes, is the library's as
// its CSS is: default and one per file of layouts/, no more, no less, each with its parameters
// (vite/layout-params.js), no more, no less. scripts/layout-types.mjs writes it from there when
// the build starts; this checks what ships. And ProjectLayouts, which a project's declaration
// file augments, and SlideLayouts are exported.
const types = await readFile(resolve(out, 'index.d.ts'), 'utf8')
const files = (await readdir(resolve(root, 'layouts'))).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4))
/** @type {Map<string, string>} layout → its parameters, camelCase, sorted, as text */
const expected = new Map([['default', '']])
for (const name of files) expected.set(name, layoutParams(await readFile(resolve(root, 'layouts', `${name}.css`), 'utf8'), name).params.map(camelize).sort().join(', '))
// the interface's body, from its brace to the one closing it, comments out
const start = types.search(/^interface LibraryLayouts \{/m)
let body = null
if (start >= 0) {
  let depth = 0
  for (let i = types.indexOf('{', start); i < types.length; i++) {
    if (types[i] === '{') depth++
    else if (types[i] === '}' && --depth === 0) {
      body = types.slice(types.indexOf('{', start) + 1, i).replace(/\/\*[\s\S]*?\*\//g, '')
      break
    }
  }
}
/** @type {Map<string, string>} */
const typed = new Map([...(body ?? '').matchAll(/(['"]?)([\w-]+)\1\s*:\s*\{([^{}]*)\}/g)]
  .map((m) => [m[2], [...m[3].matchAll(/(\w+)\??\s*:/g)].map((p) => p[1]).sort().join(', ')]))
const show = (m) => [...m].sort(([a], [b]) => a.localeCompare(b)).map(([n, p]) => `${n} (${p || 'none'})`).join('; ')
if (show(typed) !== show(expected)) {
  console.error(`[arao] LibraryLayouts (src/components/library-layouts.ts, written by scripts/layout-types.mjs) ${body == null ? 'is not in dist/types/index.d.ts' : `lists ${show(typed)}`}; layouts/ has ${show(expected)} (with default): make them the same`)
  process.exit(1)
}
const exported = types.match(/^export type \{([^}]*)\}/m)?.[1] ?? ''
for (const name of ['SlideLayouts', 'ProjectLayouts']) {
  if (!new RegExp(`\\b${name}\\b`).test(exported)) {
    console.error(`[arao] dist/types/index.d.ts does not export the type ${name}`)
    process.exit(1)
  }
}
