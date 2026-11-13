# Getting started

From an empty folder to a deck on the screen and in a PDF. You need Node 20.19 or newer.

## 1. Make the project

A slides project is a Vite app with `araojs` (and `vue` and `vite`, its peers):

```bash
mkdir my-talks && cd my-talks && npm init -y && npm pkg set type=module
npm install araojs vue && npm install -D vite
```

Four small files make it a slides project:

```js
// vite.config.js
import { defineConfig } from 'vite'
import arao from 'araojs/vite'

export default defineConfig({ plugins: [arao()] })
```

```js
// src/main.js
import { createDeckApp } from 'araojs'

createDeckApp().mount('#app')
```

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

and, in `package.json`:

```json
"scripts": { "dev": "vite", "build": "vite build", "export": "arao export" }
```

That is the whole setup:

- `arao()` is the only Vite plugin: it brings `@vitejs/plugin-vue` and Pug along (don't add
  `vue()` too; Vue's options go in `arao({ vue: { … } })`), serves the project's folders and
  builds in the icons the source names ([Vite plugin](reference/vite-plugin.md)).
- `createDeckApp()` renders the deck the URL's path names, or the list of decks at `/`
  ([The project](guide/project.md#createdeckapp)).
- The engine's CSS comes with `'araojs'`, and so do the project's themes: every CSS file of
  `src/themes` is loaded with nothing to import ([Themes](guide/themes.md)).

## 2. Write a deck

Create `src/decks/MyTalk.vue`, and put any Java file in `src/snippets/DebugFilter.java`:

```pug
<template lang="pug">
Deck(duration="30m")
  ProgressBar
  SlideNumber

  Slide(layout="cover")
    .bar
    h1 My talk
    p.muted Jane Doe · Conf 2026

  Slide
    h2 Three things
    ul
      li First, from the start
      li(v-step="2") Second, at step 2
      li(v-step="3") Third, at step 3
    Notes
      p Speaker notes: only the presenter view shows them.

  Slide(title="The code")
    h2 The code
    Snippet(file="DebugFilter.java" :highlights='{ "8-10": 2 }')

  Slide(layout="section")
    h1 Thanks!
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'araojs'
</script>
```

<details>
<summary>The same deck in HTML</summary>

A `<template>` with no `lang`, with the same components, props, slots and directives. Each file
picks its own syntax; the `<script setup>` does not change.

```vue
<template>
  <Deck duration="30m">
    <ProgressBar />
    <SlideNumber />

    <Slide layout="cover">
      <div class="bar"></div>
      <h1>My talk</h1>
      <p class="muted">Jane Doe · Conf 2026</p>
    </Slide>

    <Slide>
      <h2>Three things</h2>
      <ul>
        <li>First, from the start</li>
        <li v-step="2">Second, at step 2</li>
        <li v-step="3">Third, at step 3</li>
      </ul>
      <Notes><p>Speaker notes: only the presenter view shows them.</p></Notes>
    </Slide>

    <Slide title="The code">
      <h2>The code</h2>
      <Snippet file="DebugFilter.java" :highlights='{ "8-10": 2 }' />
    </Slide>

    <Slide layout="section">
      <h1>Thanks!</h1>
    </Slide>
  </Deck>
</template>
```

</details>

## 3. Present it

```bash
npm run dev
```

Open `http://localhost:5173/mytalk` (with one deck, `/` opens it too). `→` moves a step, `f`
goes fullscreen, `p` opens the presenter view with the notes and the timer, and the URL follows
you: `/mytalk#/3/2` is slide 3, step 2. Every key: [Presenting](guide/presenting.md); every URL:
[URLs](reference/urls.md).

## 4. Export it

```bash
npx playwright-core install chromium   # once
npm run export -- --deck mytalk        # exports/mytalk.pdf, one page per step
```

More: [Export to PDF](guide/export.md).

## Next

- [Concepts](guide/concepts.md): the canvas, zones, steps and themes in two minutes.
- [Slides and layouts](guide/slides-and-layouts.md), [Steps](guide/steps.md),
  [Code](guide/code.md), [Themes](guide/themes.md).
- Writing decks with an AI agent: give it [the Arao skill](../skills/arao/).
