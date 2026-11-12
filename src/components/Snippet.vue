<!-- Code window: macOS-style chrome, syntax colours (Shiki), per-step line/word highlights.
     Source: file="App.java" (a file in the project's snippets folder, src/snippets by default;
     language from the extension, title from the file name) or code="…" inline.
     Frame: every snippet window has the same size and position (--ph-code-width/--ph-code-height,
     capped by the space available), with the code top-left like an editor; short snippets leave
     room below. "fit" makes the window hug its content instead (for small inline snippets).
     Size: the theme's --ph-code-size is the standard size for every snippet in the deck;
     a snippet that would not fit shrinks to fit, but never grows past the standard size.
       Snippet(file="App.java" :highlights='{"2-3": 2, "5:@Bean": 3}')
       Snippet(file="legacy/App.java" name="ApplicationConfiguration.java" lang="java")
     highlights: { lineSpec[:word+++word]: step }  e.g. "4", "4-7", "1,10-14", "2:implements Filter"
     Step 1 shows the code plain; at step n the rules for n highlight their lines/words and dim the rest. -->
<template lang="pug">
.ph-snippet(ref="root" :style="vars" :class="{ fit }")
  .ph-snippet-window
    .ph-snippet-header
      .ph-snippet-lights
        i.r
        i.y
        i.g
      span.ph-snippet-name {{ title }}
    .ph-snippet-body
      .ph-snippet-code
        .ph-snippet-line(v-for="(line, i) in rendered" :key="i" :class="line.cls")
          span.ph-snippet-ln(v-if="lineNumbers") {{ i + 1 }}
          span.ph-snippet-tx
            span(v-for="(t, j) in line.tokens" :key="j" :class="t.cls" :style="t.style") {{ t.text }}
</template>

<script>
import { codeToTokens } from 'shiki'

// One tokenization per code, language and theme, shared by every snippet of the page: the
// presenter view renders the deck twice, and a theme switched back is already done. A failure
// is not kept, so the next render tries again.
const cache = new Map()
function tokenize(code, lang, theme) {
  const key = JSON.stringify([code, lang, theme])
  if (!cache.has(key)) {
    cache.set(key, codeToTokens(code, { lang, theme }).then((r) => r.tokens, (e) => {
      cache.delete(key)
      throw e
    }))
  }
  return cache.get(key)
}
</script>

<script setup>
import { computed, inject, nextTick, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { bundledLanguages } from 'shiki'
import { snippets } from 'virtual:phoenyx/snippets'
import { useSlide } from '../engine/useSlide'
import { DECK } from '../engine/registry'

const props = defineProps({
  file: String, // path inside the snippets folder
  code: String, // inline code, instead of file
  lang: String, // defaults to the file extension
  name: String, // title bar; defaults to the file name
  highlights: { type: Object, default: () => ({}) },
  lineNumbers: { type: Boolean, default: true },
  fit: Boolean, // window hugs the code instead of the standard frame
  size: Number, // px; overrides the theme's standard size (still shrinks to fit)
  theme: String, // Shiki theme; defaults to the deck theme's --ph-code-theme
})

const WORDS = '+++'
// extension → Shiki language, where they differ
const EXT_LANG = { yml: 'yaml', kt: 'kotlin', kts: 'kotlin', sh: 'bash', md: 'markdown', py: 'python',
  rb: 'ruby', rs: 'rust', ts: 'typescript', js: 'javascript', h: 'c', hpp: 'cpp', cs: 'csharp', txt: 'text',
  factories: 'properties' }
const ext = computed(() => (props.file?.match(/\.([^./]+)$/)?.[1] || '').toLowerCase())
// unknown languages render as plain text
const language = computed(() => {
  const l = props.lang || EXT_LANG[ext.value] || ext.value
  return l && l in bundledLanguages ? l : 'text'
})
const title = computed(() => props.name ?? props.file?.split('/').pop() ?? '')

const fileCode = ref('')
let loading = 0
watchEffect(async () => {
  const mine = ++loading
  if (!props.file) return
  const load = snippets[props.file]
  if (!load) {
    console.warn(`[phoenyx] Snippet: no file "${props.file}" in the snippets folder`)
    fileCode.value = `// missing snippet: ${props.file}`
    return
  }
  const text = await load()
  if (mine === loading) fileCode.value = text
})
const source = computed(() => props.code ?? fileCode.value)
const lines = computed(() => source.value.replace(/\s+$/, '').split(/\r?\n/))

// ---- syntax colours (async; plain text until ready, same layout) --------------------
// Shiki theme: prop, else the deck theme's --ph-code-theme token (re-read when the deck theme changes)
const root = ref()
const deckTheme = inject(DECK, null)?.api.theme
const tokenTheme = ref(null)
async function readTokenTheme() {
  await nextTick()
  if (root.value) tokenTheme.value = getComputedStyle(root.value).getPropertyValue('--ph-code-theme').trim().replace(/^["']|["']$/g, '') || null
}
onMounted(readTokenTheme)
if (deckTheme) watch(deckTheme, readTokenTheme)
const shikiTheme = computed(() => props.theme || tokenTheme.value || 'material-theme-darker')

const colored = shallowRef(null)
let run = 0 // only the latest tokenization may land (an older, slower one must not overwrite it)
watchEffect(async () => {
  const code = lines.value.join('\n')
  const lang = language.value
  const theme = shikiTheme.value
  const mine = ++run
  colored.value = null
  try {
    const tokens = await tokenize(code, lang, theme)
    if (mine === run) colored.value = tokens
  } catch (e) {
    console.warn(`[phoenyx] Snippet: cannot highlight "${language.value}"`, e)
    if (mine === run) colored.value = null
  }
})

// ---- steps ---------------------------------------------------------------------------
function parseLines(spec) {
  const set = new Set()
  for (const part of String(spec).split(',')) {
    const [a, b = a] = part.split('-').map(Number)
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) set.add(n)
  }
  return set
}
const rules = computed(() =>
  Object.entries(props.highlights).map(([key, step]) => {
    const c = key.indexOf(':')
    return {
      lines: parseLines(c < 0 ? key : key.slice(0, c)),
      words: c < 0 ? null : key.slice(c + 1).split(WORDS),
      step: Number(step),
    }
  }),
)
const slide = useSlide()
slide.requireSteps(() => Math.max(1, ...rules.value.map((r) => r.step)))

// ---- render model ------------------------------------------------------------------
const tokenStyle = (t) => ({
  color: t.color,
  fontStyle: t.fontStyle & 1 ? 'italic' : undefined,
  fontWeight: t.fontStyle & 2 ? 'bold' : undefined,
})
function baseTokens(i) {
  const row = colored.value?.[i]
  if (!row) return [{ text: lines.value[i] || ' ', style: null }]
  if (!row.length) return [{ text: ' ', style: null }]
  return row.map((t) => ({ text: t.content, style: tokenStyle(t) }))
}
// split tokens at the [start,end) ranges of the given words, tagging pieces hl/dim
function markWords(tokens, text, words) {
  const ranges = []
  const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
  for (let m; (m = re.exec(text)) && m[0]; ) ranges.push([m.index, m.index + m[0].length])
  const inHl = (p) => ranges.some(([a, b]) => p >= a && p < b)
  const out = []
  let pos = 0
  for (const t of tokens) {
    let piece = ''
    let cls = null
    for (const ch of t.text) {
      const c = inHl(pos++) ? 'hl' : 'dim'
      if (cls && c !== cls) { out.push({ ...t, text: piece, cls }); piece = '' }
      cls = c
      piece += ch
    }
    if (piece) out.push({ ...t, text: piece, cls })
  }
  return out
}
const rendered = computed(() => {
  const s = slide.step.value
  const active = s === 1 ? [] : rules.value.filter((r) => r.step === s)
  return lines.value.map((text, i) => {
    const tokens = baseTokens(i)
    if (!active.length) return { cls: '', tokens }
    const rule = active.find((r) => r.lines.has(i + 1))
    if (!rule) return { cls: 'dim', tokens }
    if (!rule.words) return { cls: 'hl', tokens }
    return { cls: 'words', tokens: markWords(tokens, text, rule.words) }
  })
})

// ---- size: standard size, shrink to fit ------------------------------------------------
const vars = computed(() => {
  const digits = props.lineNumbers ? String(lines.value.length).length : 0
  const cols = Math.max(1, ...lines.value.map((l) => l.replace(/\t/g, '    ').length))
  return {
    '--sn-rows': lines.value.length,
    '--sn-cols': cols + (digits ? digits + 3 : 0),
    '--sn-digits': digits,
    ...(props.size ? { '--sn-size': `${props.size}px` } : {}),
  }
})
</script>

<style>
.ph-snippet {
  /* code window palette: tokens with defaults (dark editor, like a real Mac window) */
  --sn-bg: var(--ph-code-bg, #2b2b2b);
  --sn-bar: var(--ph-code-bar, #383a40);
  --sn-fg: var(--ph-code-fg, #eeffff);
  --sn-muted: var(--ph-code-muted, #8a8f98);
  --sn-hl: var(--ph-code-hl, var(--ph-accent));
  --sn-radius: var(--ph-code-radius, 22px);
  --sn-size-std: var(--sn-size, var(--ph-code-size, 44px));
  flex: 1; min-height: 0; align-self: stretch;
  container-type: size;
  display: flex; align-items: center; justify-content: center;
}
.ph-snippet-window {
  /* standard frame: same size on every slide, never larger than the space available */
  width: min(100%, var(--ph-code-width, 1520px));
  height: min(100%, var(--ph-code-height, 760px));
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--sn-bg); color: var(--sn-fg);
  border-radius: var(--sn-radius);
  box-shadow: 0 30px 70px rgba(0, 0, 0, .35), 0 8px 20px rgba(0, 0, 0, .2),
    inset 0 0 0 1px rgba(255, 255, 255, .06);
}
.ph-snippet-header {
  flex: none; height: 80px; padding: 0 30px;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  background: var(--sn-bar);
  font: 400 34px/1 var(--ph-font-sans);
  color: var(--ph-code-title, rgba(255, 255, 255, .92));
}
.ph-snippet-lights { display: flex; gap: 18px; }
.ph-snippet-lights i { width: 24px; height: 24px; border-radius: 50%; }
.ph-snippet-lights .r { background: #ff5f57; }
.ph-snippet-lights .y { background: #febc2e; }
.ph-snippet-lights .g { background: #28c840; }
.ph-snippet-name { grid-column: 2; white-space: nowrap; }
.ph-snippet-body { flex: 1; min-height: 0; padding: 36px 48px 40px 28px; overflow: hidden; }
.ph-snippet.fit .ph-snippet-window { width: auto; height: auto; max-width: 100%; max-height: 100%; }
.ph-snippet-code {
  font-family: var(--ph-font-mono);
  line-height: 1.5;
  /* standard size, shrunk only if rows/columns would not fit the free space */
  font-size: min(
    var(--sn-size-std),
    calc((min(100cqh, var(--ph-code-height, 760px)) - 156px) / (var(--sn-rows) * 1.5)),
    calc((min(100cqw, var(--ph-code-width, 1520px)) - 76px) / (var(--sn-cols) * 0.61))
  );
}
.ph-snippet-line {
  display: flex; white-space: pre; border-radius: .2em;
  transition: opacity .3s, background-color .3s;
}
.ph-snippet-ln {
  flex: none; box-sizing: content-box;
  width: calc(var(--sn-digits) * 1ch); padding: 0 .7ch 0 .4ch; margin-right: .9ch;
  border-right: 2px solid color-mix(in srgb, var(--sn-muted) 40%, transparent);
  text-align: right; color: var(--sn-muted);
}
.ph-snippet-tx > span { transition: opacity .3s; }

/* steps */
.ph-snippet-line.dim { opacity: .28; }
.ph-snippet-line.hl { background: color-mix(in srgb, var(--sn-hl) 14%, transparent); }
.ph-snippet-line.hl .ph-snippet-ln { color: var(--sn-hl); border-right-color: var(--sn-hl); }
.ph-snippet-line.words .ph-snippet-tx .dim { opacity: .28; }
.ph-snippet-line.words .ph-snippet-tx .hl {
  background: color-mix(in srgb, var(--sn-hl) 22%, transparent); border-radius: .15em;
}
</style>
