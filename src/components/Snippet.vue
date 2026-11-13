<!-- Code window: macOS-style chrome, syntax colours (Shiki), per-step line/word highlights.
     Source: file="App.java" (a file in the project's snippets folder, src/snippets by default;
     language from the extension, title from the file name) or code="…" inline.
     Frame: every snippet window has the same shape as the slide (--ar-code-aspect, 16/9) and is as
     large as fits in the space it gets, up to --ar-code-width (1520px): on every full-slide snippet
     it has the same size and position. The code sits top-left like an editor; short snippets leave
     room below. "fit" makes the window hug its content instead (for small inline snippets).
     Size: the theme's --ar-code-size is the standard size for every snippet in the deck;
     a snippet that would not fit shrinks to fit, but never grows past the standard size.
       Snippet(file="App.java" :highlights='{"2-3": 2, "5:@Bean": 3}')
       Snippet(file="legacy/App.java" name="ApplicationConfiguration.java" lang="java")
     highlights: { lineSpec[:word+++word]: step }  e.g. "4", "4-7", "1,10-14", "2:implements Filter"
     Step 1 shows the code plain; at step n the rules for n highlight their lines/words and dim the rest.
     Until its file and colours are in it carries data-ar-busy: the export waits for it. -->
<template>
  <div class="ar-snippet" ref="root" :style="vars" :class="{ fit }" :data-ar-busy="busy ? '' : undefined">
    <div class="ar-snippet-window">
      <div class="ar-snippet-header">
        <div class="ar-snippet-lights">
          <i class="r"></i>
          <i class="y"></i>
          <i class="g"></i>
        </div>
        <span class="ar-snippet-name">{{ title }}</span>
      </div>
      <div class="ar-snippet-body">
        <div class="ar-snippet-code">
          <div class="ar-snippet-line" v-for="(line, i) in rendered" :key="i" :class="line.cls">
            <span class="ar-snippet-ln" v-if="lineNumbers">{{ i + 1 }}</span>
            <span class="ar-snippet-tx">
              <span v-for="(t, j) in line.tokens" :key="j" :class="t.cls" :style="t.style">{{ t.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { codeToTokens, type ThemedToken } from 'shiki'

// One tokenization per code, language and theme, shared by every snippet of the page: the
// presenter view renders the deck twice, and a theme switched back is already done. A failure
// is not kept, so the next render tries again.
const cache = new Map<string, Promise<ThemedToken[][]>>()
function tokenize(code: string, lang: string, theme: string): Promise<ThemedToken[][]> {
  const key = JSON.stringify([code, lang, theme])
  if (!cache.has(key)) {
    // lang and theme: names Shiki checks itself (an unknown one rejects, and is reported)
    cache.set(key, codeToTokens(code, { lang: lang as never, theme: theme as never }).then((r) => r.tokens, (e) => {
      cache.delete(key)
      throw e
    }))
  }
  return cache.get(key)!
}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch, watchEffect, type PropType } from 'vue'
import { bundledLanguages } from 'shiki'
import { snippets } from 'virtual:arao/snippets'
import { useDeck } from '../state/deck'
import { useSlide } from '../state/slide'

const props = defineProps({
  file: String, // path inside the snippets folder
  code: String, // inline code, instead of file
  lang: String, // defaults to the file extension
  name: String, // title bar; defaults to the file name
  highlights: { type: Object as PropType<Record<string, number | string>>, default: () => ({}) },
  lineNumbers: { type: Boolean, default: true },
  fit: Boolean, // window hugs the code instead of the standard frame
  size: Number, // px; overrides the theme's standard size (still shrinks to fit)
  theme: String, // Shiki theme; defaults to the deck theme's --ar-code-theme
})

const WORDS = '+++'
// extension → Shiki language, where they differ
const EXT_LANG: Record<string, string> = { yml: 'yaml', kt: 'kotlin', kts: 'kotlin', sh: 'bash', md: 'markdown', py: 'python',
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
const loadingFile = ref(false)
let loading = 0
watchEffect(async () => {
  const mine = ++loading
  loadingFile.value = false
  if (!props.file) return
  const load = snippets[props.file]
  if (!load) {
    console.warn(`[arao] Snippet: no file "${props.file}" in the snippets folder`)
    fileCode.value = `// missing snippet: ${props.file}`
    return
  }
  loadingFile.value = true
  try {
    const text = await load()
    if (mine === loading) fileCode.value = text
  } finally {
    if (mine === loading) loadingFile.value = false
  }
})
const source = computed(() => props.code ?? fileCode.value)
const lines = computed(() => source.value.replace(/\s+$/, '').split(/\r?\n/))

// ---- syntax colours (async; plain text until ready, same layout) --------------------
// Shiki theme: prop, else the deck theme's --ar-code-theme token (its default is in tokens.css;
// re-read when the deck theme changes). None (not read yet, or the token set to nothing): plain text
const root = ref()
const { theme: deckTheme } = useDeck()
const tokenTheme = ref<string | null>(null)
const themeRead = ref(false)
async function readTokenTheme() {
  await nextTick()
  if (root.value) tokenTheme.value = getComputedStyle(root.value).getPropertyValue('--ar-code-theme').trim().replace(/^["']|["']$/g, '') || null
  themeRead.value = true
}
onMounted(readTokenTheme)
watch(deckTheme, readTokenTheme)
const shikiTheme = computed(() => props.theme || tokenTheme.value)

const colored = shallowRef<ThemedToken[][] | null>(null)
const highlighting = ref(false)
let run = 0 // only the latest tokenization may land (an older, slower one must not overwrite it)
watchEffect(async () => {
  const code = lines.value.join('\n')
  const lang = language.value
  const theme = shikiTheme.value
  const mine = ++run
  colored.value = null
  highlighting.value = !!theme
  if (!theme) return
  try {
    const tokens = await tokenize(code, lang, theme)
    if (mine === run) colored.value = tokens
  } catch (e) {
    console.warn(`[arao] Snippet: cannot highlight "${language.value}"`, e)
    if (mine === run) colored.value = null
  } finally {
    if (mine === run) highlighting.value = false
  }
})
// still arriving: the file, the deck theme's code theme, or the colours
const busy = computed(() => loadingFile.value || !themeRead.value || highlighting.value)

// ---- steps ---------------------------------------------------------------------------
function parseLines(spec: string) {
  const set = new Set<number>()
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
type Piece = { text: string; style: Record<string, string | undefined> | null; cls?: 'hl' | 'dim' | null }
const tokenStyle = (t: ThemedToken) => ({
  color: t.color,
  fontStyle: (t.fontStyle ?? 0) & 1 ? 'italic' : undefined,
  fontWeight: (t.fontStyle ?? 0) & 2 ? 'bold' : undefined,
})
function baseTokens(i: number): Piece[] {
  const row = colored.value?.[i]
  if (!row) return [{ text: lines.value[i] || ' ', style: null }]
  if (!row.length) return [{ text: ' ', style: null }]
  return row.map((t) => ({ text: t.content, style: tokenStyle(t) }))
}
// split tokens at the [start,end) ranges of the given words, tagging pieces hl/dim
function markWords(tokens: Piece[], text: string, words: string[]): Piece[] {
  const ranges: [number, number][] = []
  // whole words only: "Filter" must not light up the end of "LoggingFilter" (a \b is added on
  // the sides of a word that start/end with a word character; "MDC.put(" still matches as is)
  const re = new RegExp(words.map((w) => {
    const body = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return (/^\w/.test(w) ? '\\b' : '') + body + (/\w$/.test(w) ? '\\b' : '')
  }).join('|'), 'g')
  for (let m; (m = re.exec(text)) && m[0]; ) ranges.push([m.index, m.index + m[0].length])
  const inHl = (p: number) => ranges.some(([a, b]) => p >= a && p < b)
  const out: Piece[] = []
  let pos = 0
  for (const t of tokens) {
    let piece = ''
    let cls: 'hl' | 'dim' | null = null
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
.ar-snippet {
  /* code window palette: tokens (defaults in tokens.css: a light editor, like a real Mac window) */
  --sn-bg: var(--ar-code-bg);
  --sn-bar: var(--ar-code-bar);
  --sn-fg: var(--ar-code-fg);
  --sn-muted: var(--ar-code-muted);
  --sn-hl: var(--_ar-code-hl);
  --sn-radius: var(--ar-code-radius);
  --sn-size-std: var(--sn-size, var(--ar-code-size));
  /* window box: fixed shape, as large as fits (cq units resolve against this element: they are
     substituted where used, in its children) */
  --sn-aspect: var(--ar-code-aspect);
  --sn-w: min(100cqw, var(--ar-code-width), 100cqh * (var(--sn-aspect)));
  --sn-h: calc(var(--sn-w) / (var(--sn-aspect)));
  flex: 1; min-height: 0; align-self: stretch;
  container-type: size;
  display: flex; align-items: center; justify-content: center;
}
.ar-snippet-window {
  /* standard frame: the slide's shape, as large as the space allows */
  width: var(--sn-w);
  height: var(--sn-h);
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--sn-bg); color: var(--sn-fg);
  border-radius: var(--sn-radius);
  box-shadow: var(--ar-code-shadow);
}
.ar-snippet-header {
  flex: none; height: 80px; padding: 0 30px;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  background: var(--sn-bar);
  font: 400 var(--ar-code-title-size)/1 var(--ar-font-sans);
  color: var(--ar-code-title);
}
.ar-snippet-lights { display: flex; gap: 18px; }
.ar-snippet-lights i { width: 24px; height: 24px; border-radius: 50%; }
.ar-snippet-lights .r { background: var(--ar-code-light-1); }
.ar-snippet-lights .y { background: var(--ar-code-light-2); }
.ar-snippet-lights .g { background: var(--ar-code-light-3); }
.ar-snippet-name { grid-column: 2; white-space: nowrap; }
.ar-snippet-body { flex: 1; min-height: 0; padding: 36px 48px 40px 28px; overflow: hidden; }
.ar-snippet.fit { --sn-w: min(100cqw, var(--ar-code-width)); --sn-h: 100cqh; }
.ar-snippet.fit .ar-snippet-window { width: auto; height: auto; max-width: 100%; max-height: 100%; }
.ar-snippet-code {
  font-family: var(--ar-font-mono);
  line-height: 1.5;
  /* standard size, shrunk only if rows/columns would not fit the free space */
  font-size: min(
    var(--sn-size-std),
    calc((var(--sn-h) - 156px) / (var(--sn-rows) * 1.5)),
    calc((var(--sn-w) - 76px) / (var(--sn-cols) * 0.61))
  );
}
.ar-snippet-line {
  display: flex; white-space: pre;
  transition: opacity var(--ar-code-duration);
}
.ar-snippet-ln {
  flex: none; box-sizing: content-box;
  width: calc(var(--sn-digits) * 1ch); padding: 0 .7ch 0 .4ch; margin-right: .4ch;
  border-right: 2px solid color-mix(in srgb, var(--sn-muted) 40%, transparent);
  text-align: right; color: var(--sn-muted);
}
/* the code side of a line: highlights shade this, not the line numbers */
.ar-snippet-tx {
  flex: 1; min-width: 0; padding-left: .5ch; border-radius: .2em;
  transition: background-color var(--ar-code-duration);
}
.ar-snippet-tx > span { transition: opacity var(--ar-code-duration); }

/* steps */
.ar-snippet-line.dim { opacity: .28; }
/* the highlight's background: --ar-code-hl-bg, else the highlight colour at 14 % (a line) or 22 % (a
   word): tokens.css */
.ar-snippet-line.hl .ar-snippet-tx { background: var(--_ar-code-hl-line); }
/* a run of highlighted lines reads as one block */
.ar-snippet-line.hl + .ar-snippet-line.hl .ar-snippet-tx { border-top-left-radius: 0; border-top-right-radius: 0; }
.ar-snippet-line.hl:has(+ .ar-snippet-line.hl) .ar-snippet-tx { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.ar-snippet-line.hl .ar-snippet-ln { color: var(--sn-hl); border-right-color: var(--sn-hl); }
.ar-snippet-line.words .ar-snippet-tx .dim { opacity: .28; }
.ar-snippet-line.words .ar-snippet-tx .hl {
  background: var(--_ar-code-hl-word); border-radius: .15em;
}
/* in speaker notes (Notes, wherever they are drawn: the presenter's panel, the export's notes
   pages), a box with no height of its own: the window takes its natural size, its full code at its
   size */
.ar-note .ar-snippet { container-type: inline-size; flex: none; margin: .4em 0 .8em; }
.ar-note .ar-snippet-window { width: 100%; height: auto; }
.ar-note .ar-snippet-code { font-size: var(--sn-size-std); }
</style>
