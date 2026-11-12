<!-- Internal. The list of a project's decks, which createDeckApp() (app.js) shows when the URL
     names no deck and the project has more than one, or names one that is no deck (missing).
     A plain page, not a canvas: one link per deck, to ?deck=<name>, its title over its name. Each
     link keeps the page's other query parameters, not its hash (/?presenter&theme=x links to
     ?deck=<name>&presenter&theme=x). It wears the shipped default theme's tokens, and the
     system's colours where the project does not import that theme. Its text is in Spanish, like
     the rest of the engine's own UI, and says so (lang="es") whatever the page's <html lang>. -->
<template>
  <main class="ar-decks" data-theme="default" lang="es">
    <h1 class="ar-decks-heading">Presentaciones</h1>
    <p class="ar-decks-missing" v-if="missing" role="alert">
      No hay ninguna presentación «{{ missing }}»{{ decks.length ? '. Elige una:' : '.' }}
    </p>
    <ul class="ar-decks-list" v-if="decks.length">
      <li v-for="d in decks" :key="d.name">
        <a class="ar-decks-link" :href="href(d.name)">
          <span class="ar-decks-text">
            <span class="ar-decks-title">{{ d.title }}</span>
            <code class="ar-decks-name">?deck={{ d.name }}</code>
          </span>
          <span class="ar-decks-go" aria-hidden="true">→</span>
        </a>
      </li>
    </ul>
    <p class="ar-decks-empty" v-else>
      No hay presentaciones en {{ dir }}: cada fichero .vue directamente en esa carpeta es una.
    </p>
  </main>
</template>

<script setup>
defineProps({
  // { name, title } per deck: name is what ?deck= takes, title what the list shows
  decks: { type: Array, required: true },
  // the name asked for that is no deck, if any
  missing: { type: String, default: null },
  // the decks folder, for the page of a project with none
  dir: { type: String, default: '' },
})

// the page's query but its deck, written back as it came: a flag stays a flag (&presenter, not
// &presenter=); the hash stays behind
const kept = [...new URLSearchParams(location.search)]
  .filter(([key]) => key !== 'deck')
  .map(([key, value]) => encodeURIComponent(key) + (value ? `=${encodeURIComponent(value)}` : ''))
const href = (name) => [`?deck=${encodeURIComponent(name)}`, ...kept].join('&')
</script>

<style>
.ar-decks {
  box-sizing: border-box;
  min-height: 100%;
  padding: 72px 24px;
  background: var(--ar-bg, Canvas);
  color: var(--ar-fg, CanvasText);
  font-family: var(--ar-font-sans, system-ui, sans-serif);
  font-size: 18px;
  line-height: 1.4;
}
.ar-decks > * { box-sizing: border-box; max-width: 720px; margin-inline: auto; }
.ar-decks-heading { margin-block: 0 32px; font-size: 40px; line-height: 1.1; }
.ar-decks-heading::before {
  content: ''; display: block;
  width: 64px; height: 6px; margin-bottom: 20px;
  border-radius: 3px; background: var(--ar-accent, LinkText);
}
.ar-decks-missing {
  margin-block: 0 24px; padding: 12px 16px;
  border-left: 4px solid var(--ar-accent, LinkText);
  background: color-mix(in srgb, var(--ar-fg, CanvasText) 6%, transparent);
  overflow-wrap: anywhere;
}
.ar-decks-list { list-style: none; margin-block: 0; padding: 0; display: grid; gap: 12px; }
.ar-decks-link {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 22px;
  border: 1px solid color-mix(in srgb, var(--ar-fg, CanvasText) 16%, transparent);
  border-radius: min(var(--ar-radius, 12px), 16px);
  color: inherit; text-decoration: none;
  transition: border-color .15s, background-color .15s;
}
.ar-decks-link:hover {
  border-color: var(--ar-accent, LinkText);
  background: color-mix(in srgb, var(--ar-fg, CanvasText) 5%, transparent);
}
.ar-decks-link:focus-visible { outline: 3px solid var(--ar-accent, LinkText); outline-offset: 3px; }
.ar-decks-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.ar-decks-title { font-size: 24px; font-weight: 600; overflow-wrap: anywhere; }
.ar-decks-name { font-family: var(--ar-font-mono, ui-monospace, monospace); font-size: 15px; color: var(--ar-muted, GrayText); overflow-wrap: anywhere; }
.ar-decks-go { flex: none; font-size: 24px; color: var(--ar-accent, LinkText); transition: transform .15s; }
.ar-decks-link:hover .ar-decks-go, .ar-decks-link:focus-visible .ar-decks-go { transform: translateX(4px); }
.ar-decks-empty { margin-block: 0; color: var(--ar-muted, GrayText); }
@media (prefers-reduced-motion: reduce) {
  .ar-decks-link, .ar-decks-go { transition: none; }
}
</style>
