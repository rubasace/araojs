<!-- Internal. The list of a project's decks, which createDeckApp() (app.js) shows at / (the app's
     base) when the project has more than one deck (or always, deckList: 'always'), and at a path
     that names no deck (missing). A plain page, not a canvas: a card per deck, with its cover
     drawn in it (views/parts/DeckCover.vue: the deck itself, small, still and inert, drawn once
     the card nears the viewport), its title (the cover's first heading once drawn, else the file
     name in words) and its path. Each card is one link, to the deck's path; it keeps the page's
     query, not its hash (/?presenter&theme=x links to /<name>?presenter&theme=x).
     Its own dark look, as the presenter view's and the controls', whatever the decks' themes: each
     cover wears its deck's first theme. Its text is in Spanish, like the rest of the engine's own
     UI, and says so (lang="es") whatever the page's <html lang>. -->
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
            <span class="ar-decks-title">{{ titles[d.name] || d.title }}</span>
            <span class="ar-decks-foot">
              <code class="ar-decks-path">{{ d.href }}</code>
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
import DeckCover from './parts/DeckCover.vue'

defineProps({
  // { name, title, href, load } per deck: name is what its path takes, title what the card shows
  // until the cover gives its own, href its path, load its loader
  decks: { type: Array, required: true },
  // the name asked for that is no deck, if any
  missing: { type: String, default: null },
  // the decks folder, for the page of a project with none
  dir: { type: String, default: '' },
})

// each deck's cover title, as its cover tells it (DeckCover)
const titles = reactive({})

// the page's query, written back as it came: a flag stays a flag (&presenter, not &presenter=);
// the hash stays behind
const kept = [...new URLSearchParams(location.search)]
  .map(([key, value]) => encodeURIComponent(key) + (value ? `=${encodeURIComponent(value)}` : ''))
const query = kept.length ? `?${kept.join('&')}` : ''
</script>

<style>
/* window px, not canvas px; the palette is the presenter view's */
:root:has(.ar-decks) {
  --ar-decks-bg: #14161b;
  --ar-decks-panel: #1c1f26;
  --ar-decks-raised: #222631;
  --ar-decks-frame: #0d0f13;
  --ar-decks-line: #2b2f39;
  --ar-decks-line-hover: #3c4252;
  --ar-decks-edge: rgba(255, 255, 255, .08);
  --ar-decks-sheen: rgba(255, 255, 255, .045);
  --ar-decks-fg: #eceef2;
  --ar-decks-dim: #949bab;
  --ar-decks-accent: #5b9dff;
  --ar-decks-shadow: 0 18px 40px rgba(0, 0, 0, .38), 0 2px 8px rgba(0, 0, 0, .24);
  --ar-decks-radius: 14px;
  background: var(--ar-decks-bg);
  color-scheme: dark;
}
.ar-decks {
  box-sizing: border-box;
  min-height: 100%;
  padding: clamp(28px, 6vw, 72px) clamp(16px, 4vw, 48px) clamp(40px, 6vw, 80px);
  background: var(--ar-decks-bg);
  color: var(--ar-decks-fg);
  font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ar-decks-page { max-width: 1200px; margin-inline: auto; }

.ar-decks-head { margin-bottom: clamp(24px, 4vw, 40px); }
.ar-decks-heading { margin: 0; font-size: clamp(28px, 3.2vw, 40px); font-weight: 700; line-height: 1.1; letter-spacing: -.01em; }
.ar-decks-heading::before {
  content: ''; display: block;
  width: 48px; height: 5px; margin-bottom: 18px;
  border-radius: 3px; background: var(--ar-decks-accent);
}
.ar-decks-count { margin: 8px 0 0; color: var(--ar-decks-dim); font-size: 15px; font-variant-numeric: tabular-nums; }

.ar-decks-missing {
  margin: 0 0 28px; padding: 14px 18px;
  border: 1px solid var(--ar-decks-line); border-left: 4px solid var(--ar-decks-accent);
  border-radius: 10px; background: var(--ar-decks-panel);
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
  border: 1px solid var(--ar-decks-line); border-radius: var(--ar-decks-radius);
  background: var(--ar-decks-panel);
  transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease, translate .18s ease;
}
.ar-decks-card:hover {
  border-color: var(--ar-decks-line-hover);
  background: var(--ar-decks-raised);
  box-shadow: var(--ar-decks-shadow);
  translate: 0 -2px;
}
.ar-decks-card:has(.ar-decks-link:focus-visible) {
  border-color: var(--ar-decks-accent);
  outline: 2px solid var(--ar-decks-accent); outline-offset: 3px;
}

/* the cover's frame: 16:9, its own edge drawn over it; empty (a soft sheen going by) until the
   cover is drawn in it, or says it cannot be */
.ar-decks-preview {
  position: relative; overflow: hidden; color: var(--ar-decks-dim);
  aspect-ratio: 16 / 9; margin: 7px 7px 0;
  border-radius: calc(var(--ar-decks-radius) - 7px);
  background: var(--ar-decks-frame);
}
.ar-decks-preview::after {
  content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  border-radius: inherit; box-shadow: inset 0 0 0 1px var(--ar-decks-edge);
}
.ar-decks-preview:not(:has(.ar-thumb, .ar-cover-failed))::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 30%, var(--ar-decks-sheen) 50%, transparent 70%);
  animation: ar-decks-sheen 1.6s ease-in-out infinite;
}
@keyframes ar-decks-sheen { from { translate: -100% 0; } to { translate: 100% 0; } }
.ar-decks-preview .ar-thumb { animation: ar-decks-in .3s ease both; }
@keyframes ar-decks-in { from { opacity: 0; } }

.ar-decks-link {
  flex: 1; display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px 16px;
  color: inherit; text-decoration: none; outline: none;
}
.ar-decks-link::after { content: ''; position: absolute; inset: 0; z-index: 2; border-radius: inherit; }
.ar-decks-title {
  font-size: 17px; font-weight: 650; line-height: 1.3;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2;
  overflow: hidden; overflow-wrap: anywhere;
}
.ar-decks-foot { margin-top: auto; display: flex; align-items: center; gap: 12px; }
.ar-decks-path {
  flex: 1; min-width: 0;
  font: 13px/1.3 ui-monospace, "SFMono-Regular", Menlo, monospace; color: var(--ar-decks-dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ar-decks-go {
  flex: none; width: 18px; height: 18px;
  fill: none; stroke: var(--ar-decks-dim); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  transition: stroke .18s ease, translate .18s ease;
}
.ar-decks-card:is(:hover, :has(.ar-decks-link:focus-visible)) .ar-decks-go { stroke: var(--ar-decks-accent); translate: 3px 0; }

.ar-decks-empty { margin: 0; color: var(--ar-decks-dim); }

@media (prefers-reduced-motion: reduce) {
  .ar-decks-card, .ar-decks-go { transition: none; }
  .ar-decks-card:hover, .ar-decks-card:is(:hover, :has(.ar-decks-link:focus-visible)) .ar-decks-go { translate: none; }
  .ar-decks-preview::before, .ar-decks-preview .ar-thumb { animation: none; }
}
</style>
