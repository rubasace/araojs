<!-- Internal. The list of a project's decks, which createDeckApp() (app.js) shows at / (the app's
     base) when the project has more than one deck (or always, deckList: 'always'), and at a path
     that names no deck (missing). A plain page, not a canvas: a card per deck, with its cover
     drawn in it (components/internal/DeckCover.vue: the deck itself, small, still and inert, drawn once
     the card nears the viewport), its title (the file name in words: there from the start, so
     it never changes under the reader), under it the cover's first heading once the cover tells
     it (on a line kept for it, so nothing moves; left empty when it says the same as the title),
     and its path, as the reader reads it (not percent-encoded). Every card has the same shape
     (one line each, cut with an ellipsis), so the cards of a row are as tall as each other with
     no gap inside any. Each card is one link, to the deck's path; it keeps the page's query, not
     its hash (/?presenter&theme=x links to /<name>?presenter&theme=x).
     Its own dark look, as the presenter view's and the controls', whatever the decks' themes (its
     --ar-selector-* tokens, styles/tokens.css: it sits in no theme, so a :root rule restyles it):
     each cover wears its deck's first theme (the first of its list that is a theme, else
     'default'), in the card's frame (a deck of another shape than the frame shows the frame
     around it, not its theme's letterbox). Until a cover is drawn, a soft sheen goes by in its
     frame (a still tint when the reader asks for reduced motion).
     Its text is in Spanish, like the rest of the engine's own UI, and says so (lang="es")
     whatever the page's <html lang>. -->
<template>
  <main class="ar-decks" lang="es">
    <div class="ar-decks-page">
      <header class="ar-decks-head">
        <h1 class="ar-decks-heading">Presentaciones</h1>
        <p class="ar-decks-count" v-if="decks.length">
          {{ decks.length }} {{ decks.length === 1 ? 'presentación' : 'presentaciones' }}
        </p>
      </header>
      <p class="ar-decks-missing" v-if="missing" role="alert">
        No hay ninguna presentación «{{ missing }}»{{ decks.length ? '. Elige una:' : '.' }}
      </p>
      <ul class="ar-decks-grid" v-if="decks.length">
        <li class="ar-decks-card" v-for="d in decks" :key="d.name">
          <div class="ar-decks-preview">
            <DeckCover :name="d.name" :load="d.load" @title="(t) => (titles[d.name] = t)" />
          </div>
          <!-- the link covers the whole card (::after); the cover stays outside it, inert -->
          <a class="ar-decks-link" :href="d.href + query">
            <span class="ar-decks-title">{{ d.title }}</span>
            <span class="ar-decks-sub">{{ subtitle(d) }}</span>
            <span class="ar-decks-foot">
              <code class="ar-decks-path">{{ d.path }}</code>
              <svg class="ar-decks-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </a>
        </li>
      </ul>
      <p class="ar-decks-empty" v-else>
        No hay presentaciones en {{ dir }}: cada fichero .vue directamente en esa carpeta es una.
      </p>
    </div>
  </main>
</template>

<script setup>
import { reactive } from 'vue'
import DeckCover from '../components/internal/DeckCover.vue'

defineProps({
  // { name, title, href, path, load } per deck: name is what its path takes, title what the card
  // shows (the file name in words), href its path as a link and path as the reader reads it (not
  // percent-encoded), load its loader
  decks: { type: Array, required: true },
  // the name asked for that is no deck, if any
  missing: { type: String, default: null },
  // the decks folder, for the page of a project with none
  dir: { type: String, default: '' },
})

// each deck's cover title, as its cover tells it (DeckCover); shown under the title unless it
// says the same (letters and digits compared, whatever the case)
const titles = reactive({})
const bare = (s) => s.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
const subtitle = (d) => {
  const t = titles[d.name] ?? ''
  return bare(t) && bare(t) !== bare(d.title) ? t : ''
}

// the page's query, written back as it came: a flag stays a flag (&presenter, not &presenter=);
// the hash stays behind
const kept = [...new URLSearchParams(location.search)]
  .map(([key, value]) => encodeURIComponent(key) + (value ? `=${encodeURIComponent(value)}` : ''))
const query = kept.length ? `?${kept.join('&')}` : ''
</script>

<style>
/* Window px, not canvas px. Not a theme's: its own look, in the --ar-selector-* tokens (set at the
   root, styles/tokens.css), its type in multiples of --ar-ui-text. Each rule is one ar- class; the
   states it depends on go in :where(), so that a later rule of the same class wins (the
   reduced-motion ones below). */
html:has(.ar-decks) {
  background: var(--ar-selector-bg);
  color-scheme: dark;
}
.ar-decks {
  box-sizing: border-box;
  min-height: 100%;
  padding: clamp(28px, 6vw, 72px) clamp(16px, 4vw, 48px) clamp(40px, 6vw, 80px);
  background: var(--ar-selector-bg);
  color: var(--ar-selector-fg);
  font: var(--ar-ui-text)/1.45 var(--ar-ui-font);
}
.ar-decks-page { max-width: 1200px; margin-inline: auto; }

.ar-decks-head { margin-bottom: clamp(24px, 4vw, 40px); }
.ar-decks-heading {
  margin: 0; font-size: clamp(calc(var(--ar-ui-text) * 1.75), 3.2vw, calc(var(--ar-ui-text) * 2.5));
  font-weight: 700; line-height: 1.1; letter-spacing: -.01em;
}
.ar-decks-heading::before {
  content: ''; display: block;
  width: 48px; height: 5px; margin-bottom: 18px;
  border-radius: 3px; background: var(--ar-selector-accent);
}
.ar-decks-count { margin: 8px 0 0; color: var(--ar-selector-dim); font-size: calc(var(--ar-ui-text) * .9375); font-variant-numeric: tabular-nums; }

.ar-decks-missing {
  margin: 0 0 28px; padding: 14px 18px;
  border: 1px solid var(--ar-selector-line); border-left: 4px solid var(--ar-selector-accent);
  border-radius: calc(var(--ar-selector-radius) * 5 / 7); background: var(--ar-selector-panel);
  overflow-wrap: anywhere;
}

/* one to three columns: as many 300 px cards as fit in the page's 1200 px */
.ar-decks-grid {
  list-style: none; margin: 0; padding: 0;
  display: grid; gap: clamp(16px, 2.4vw, 28px);
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
}
.ar-decks-card {
  position: relative;
  display: flex; flex-direction: column;
  border: 1px solid var(--ar-selector-line); border-radius: var(--ar-selector-radius);
  background: var(--ar-selector-panel);
  transition: border-color var(--ar-ui-duration) ease, background-color var(--ar-ui-duration) ease,
    box-shadow var(--ar-ui-duration) ease, translate var(--ar-ui-duration) ease;
}
.ar-decks-card:where(:hover) {
  border-color: var(--ar-selector-line-hover);
  background: var(--ar-selector-raised);
  box-shadow: var(--ar-selector-shadow);
  translate: 0 -2px;
}
/* its link is the card's one focusable element (the cover is inert) */
.ar-decks-card:where(:has(:focus-visible)) {
  border-color: var(--ar-selector-accent);
  outline: 2px solid var(--ar-selector-accent); outline-offset: 3px;
}

/* the cover's frame: 16:9, its own edge drawn over it; empty (a soft sheen going by) until the
   cover is drawn in it, or says it cannot be. A cover of another shape is letterboxed in the
   frame's own colour */
.ar-decks-preview {
  position: relative; overflow: hidden; color: var(--ar-selector-dim);
  aspect-ratio: 16 / 9; margin: 7px 7px 0;
  border-radius: calc(var(--ar-selector-radius) * .5);
  background: var(--ar-selector-frame);
}
.ar-decks-preview::after {
  content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  border-radius: inherit; box-shadow: inset 0 0 0 1px var(--ar-selector-edge);
}
.ar-decks-preview:where(:not(:has(.ar-thumb, .ar-cover-failed)))::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 20%, var(--ar-selector-sheen) 50%, transparent 80%);
  animation: ar-decks-sheen calc(var(--ar-ui-duration) * 7) ease-in-out infinite;
}
@keyframes ar-decks-sheen { from { translate: -100% 0; } to { translate: 100% 0; } }
/* the cover paints no letterbox of its own (components/internal/Thumbnail.vue): the frame shows around it.
   Two classes, so that it wins over .ar-thumb's own rule whatever their order in arao.css */
.ar-decks-preview .ar-thumb { background: none; animation: ar-decks-in calc(var(--ar-ui-duration) * 1.5) ease both; }
@keyframes ar-decks-in { from { opacity: 0; } }

.ar-decks-link {
  flex: 1; display: flex; flex-direction: column; gap: 4px;
  padding: 14px 16px 16px;
  color: inherit; text-decoration: none; outline: none;
}
.ar-decks-link::after { content: ''; position: absolute; inset: 0; z-index: 2; border-radius: inherit; }
/* title, cover heading, path: one line each, whatever their length, so every card has one shape */
.ar-decks-title, .ar-decks-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-decks-title {
  font-size: calc(var(--ar-ui-text) * 1.0625); font-weight: 650;
  line-height: calc(var(--ar-ui-text) * 1.375); height: calc(var(--ar-ui-text) * 1.375);
}
.ar-decks-sub {
  font-size: calc(var(--ar-ui-text) * .875); color: var(--ar-selector-dim);
  line-height: calc(var(--ar-ui-text) * 1.25); height: calc(var(--ar-ui-text) * 1.25);
}
.ar-decks-foot { margin-top: 6px; display: flex; align-items: center; gap: 12px; }
.ar-decks-path {
  flex: 1; min-width: 0;
  font: calc(var(--ar-ui-text) * .8125)/1.3 var(--ar-ui-mono); color: var(--ar-selector-dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ar-decks-go {
  flex: none; width: 18px; height: 18px;
  fill: none; stroke: var(--ar-selector-dim); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  transition: stroke var(--ar-ui-duration) ease, translate var(--ar-ui-duration) ease;
}
:where(.ar-decks-card:is(:hover, :has(:focus-visible))) .ar-decks-go { stroke: var(--ar-selector-accent); translate: 3px 0; }

.ar-decks-empty { margin: 0; color: var(--ar-selector-dim); }

/* nothing moves: no lift, no arrow going by, no fade-in; a still tint instead of the sheen */
@media (prefers-reduced-motion: reduce) {
  .ar-decks-card, .ar-decks-go { transition: none; translate: none; }
  .ar-decks-preview .ar-thumb { animation: none; }
  .ar-decks-preview::before { animation: none; background: var(--ar-selector-still); }
}
</style>
