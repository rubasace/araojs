#!/usr/bin/env node
// Packaged-consumer smoke test: installs the packed library into a brand-new slides project, the
// way a user would, and checks that it builds, that every deck runs without a warning, and that
// the export CLI prints a PDF of each deck, per step and per slide.
//
//   node scripts/smoke.mjs [path/to/package.tgz]
//
// Without a tarball it packs one itself (npm pack, which builds the library first).
// The project is made in a temporary folder outside the repository: package.json depending on the
// tarball (vite and vue at the versions of the library's devDependencies), vite.config.js with the
// arao() plugin and three theme sources (src/themes, src/venues and a theme package, THEME_SOURCES),
// index.html, src/main.js (createDeckApp, nothing else: no theme is imported by hand), a
// shortcuts file (src/shortcuts.ts: SHORTCUTS), a theme of
// its own in src/themes (THEME, in a file of another name: the plugin names it by its selector;
// and THEME-extra, in a partial that file @import-s), ROOM in src/venues, IMPORTED in a theme
// package it depends on (vendor/, its CSS in the folder its package.json names), the playground's decks, images,
// snippets, layouts (src/layouts) and slides (src/slides: a component wrapping Slide) as content, and six decks of its own (so that the project has several and /
// lists them; the second has a duration and lists its themes, the third neither: it gets every
// theme there is; the fourth a file name and a cover heading far too long for its card, and THEME
// first; the fifth lists first IMPORTED, the theme package's; the sixth opens on its Agenda; the
// seventh, DENSE, holds crowded slides that must fit).
// Then, in order:
//   1. npm install
//   2. vite build                      must pass, and write dist/404.html, a copy of index.html,
//      and hold the CSS of every layout: the installed package's layouts/ and the project's
//      src/layouts; a project cover.css replaces the library's (a message says so, and its CSS is
//      not in the build), and a layout file whose name is no layout's, or that names no
//      .layout-<name>, warns and is loaded; each build writes src/arao-layouts.d.ts, the project's
//      layouts' valid names (for the editor and vue-tsc), each with its parameters (the tokens it
//      reads: the playground's epigraph's), the project's cover's replacing the library's (its
//      tone typed as the values its doc block gives it, 'light' | 'dark'), and its token named as
//      an HTML attribute (--ar-layout-cover-title) none, with one warning; with the
//      zones each places (the cover's doc block's @zone, then the .ar-zone-<name> its CSS styles
//      under .layout-cover, not a rule of split's) and its doc (read after a licence header, a Pug
//      line starting with @ kept in its example), and one warning for its @param naming no token,
//      and one for the literal colour a rule of it writes (a layout's colours are theme tokens);
//      with those files, <bin> layouts --json (the config printing as it loads: on stderr) gives
//      the araojs version and lists default, the library's but cover (each documented in full;
//      overlay's position with its nine values, its scrim 0..1 and none),
//      then every project file (cover replacing the library's, as its doc block says, its /**
//      comment after its code and its literal colour problems; epigraph, the playground's,
//      documented; plain, with no doc block and its problem; "bad name", which no slide can
//      name), then the utility classes by
//      group (classGroups, each with a summary, an example and its classes, UTILITY_CLASSES
//      among them, each described, none twice in a group: from the stylesheet the package ships);
//      and <bin> layouts prints a block per layout saying
//      where it comes from, then a block per group of classes;
//      with a theme source that is a package not installed, one that gives no theme, one whose
//      themes folder is outside it, or a bare name that is a root folder, it must stop with an
//      [arao] error (the last one with the "./" hint); a name two sources give warns once (a
//      project theme named like a built-in one too, saying its left-out tokens are the built-in's),
//      and a source named twice (the library's own package included) does not warn about itself;
//      a project theme named like a built-in one replaces it (a message says so, and the built-in
//      file's CSS is not in the build); and it writes the files and @font-face of the web font
//      THEME names (WEB_FONT: 400 and 700) and of the defaults' (the engine's CSS: Gelasio, 400,
//      600 and 700, upright and italic) (SKIPPED where the font provider is unreachable); with arao({ fonts: false }), no font files; with
//      system fonts only and builtinThemes: false, no @font-face but for the defaults' families
//      and no word about fonts; with one built-in theme (builtinThemes: [name]), no @font-face but
//      for that theme's families and the defaults'; with a name that is no built-in theme, the
//      build stops
//   3. every deck of src/decks, under the dev server (Vue's own warnings only exist in dev) and
//      under vite preview (the production build): opened at /<name>, walked with ArrowRight
//      until the hash stops changing; any console warning/error or page error fails, and so does
//      a deck with no slides; and the playground's deck (it lists no themes) walked the same in
//      each of the library's built-in themes (BUILTIN: the installed package's themes/ folder)
//   4. the deck selector, under both servers: / lists every deck, each card with its cover drawn
//      in it (a .ar-slide), its title the file name in words (TITLES) from the list's first
//      render (recorded before any cover is drawn) and the same once the covers are in, the
//      second and the fourth deck's cover heading under its title, its path as its link's
//      (decoded), every card as tall as the others, its title, cover heading and path on one line
//      each (the fourth deck's cut), each cover in its deck's first theme (the fourth's THEME, the
//      fifth's IMPORTED, the others' default), and the page's URL left as it was; each link (the first
//      followed with the keyboard) opens its deck; the links keep the page's query, and the
//      covers stay covers on /?presenter; ?deck=<name> is moved to /<name>, keeping the rest of
//      the query and the hash; an unknown path, and an unknown ?deck=, show the list with a
//      notice and one warning
//   4b. a layout's parameters as Slide's attributes, under both servers: the second deck's cover
//      binds bar to a ref (BAR), which is --ar-layout-cover-bar in its section's style (its .bar
//      painted with it), not an attribute, in the audience view, the presenter view, export mode
//      and its thumbnail in the list, and follows the ref; an attribute that is no parameter
//      (data-smoke) still reaches the section; the playground's image-right (the library's
//      layout) takes columns="3fr 2fr", its epigraph (the project's) size="48px"
//   4c. the slides of the deck, under both servers, on the playground's deck: a slide of the
//      project's own (src/slides/WrappedSlide.vue, a component wrapping Slide) is a slide like the
//      others: in its place, its heading its header's title and its name in the jump list, its
//      two steps walked, a page per step in the export; and Agenda lists the deck's sections,
//      each done, current (aria-current) or upcoming as seen from its slide, in the audience
//      view, the presenter view (its slide and the preview's copy) and the export's book, each
//      with its own look on a slide of the default layout (its CSS, in the package's arao.css);
//      on the sixth deck, an Agenda on its first slide, in its window and in its thumbnail in the
//      list, and a hand-written ol.agenda with the same look
//   4d. the utility classes, under both servers (so the package's arao.css has them), on the
//      playground's slide "Utility classes" at its last step: .cols lays its two children out in
//      columns of 3 to 2 (style="--ar-cols: 3fr 2fr"), which they do not inherit; .middle centres
//      each one in its column, .grow fills; .row is a centred row, .stack a column, .gap-sm the
//      small gap; .text-lg and .text-sm are 1.25 and .75 times the text; .accent is the accent and
//      .highlight has a background of its own
//   4e. the overlay layout, under both servers (the build's CSS keeps its container style
//      queries), on the playground's overlay slide: position="top-right" is its token, not an
//      attribute, and puts the text top right; each of the nine positions, set as the token,
//      puts the text in that corner, side or centre of the slide's padding box, its title aligned
//      to that side (a list in its body keeping its own alignment), over its scrim (a radial ramp from the corner, a linear one from the side,
//      an even veil for center); scrim 0 draws nothing, none no scrim, 1 is black at the text's
//      side; a value that is no position (end start) is the default, bottom-left; and a position
//      set at :root, as a theme does, reaches the slide
//   4f. crowded slides, under both servers, on DENSE, in every built-in theme, at 1600x900: each
//      slide stayed on long enough for the engine to measure it, and nothing warns (in dev an
//      overflow would: "[arao] overflow"); measured here too, the body's text inside the slide's
//      padding: grids of 11, 12 and 13 blocks fit; Slide.fit's list, which does not fit without
//      the class, fits with it (--_ar-fit on the body, from .6 to 1); Slide.scale-80's body is
//      .8 of the slide's text; so do, on Slide.fit, an Agenda of ten sections and a grid whose
//      pictures are given 300px (icon-size), neither of which fits without the class, and fit
//      shrinks what is not in em too: the Agenda's rows and the pictures are --_ar-fit of their size
//   4g. an Agenda on a section slide, under both servers, on the sixth deck, in every built-in
//      theme: done, current and upcoming, each item's text and number at 3:1 at least against
//      the section's background (the accent it draws in elsewhere), measured on the pixels
//   5. useDeck()'s face, under the dev server, on the second deck: frozen, its refs read-only all
//      the way down, setTheme refuses a name the deck has not (one [arao] warning), and in the
//      presenter view's preview no function acts
//   5b. themes, under the dev server, on the third deck (no themes listed): it wears 'default' and
//      lists 'default', then THEME, THEME-extra, ROOM, IMPORTED and LINKED (source after source),
//      then the other built-in themes; a theme added to the linked package (outside the root) while
//      it runs is offered by the next page; t cycles to THEME, and ?theme=THEME wears it; each
//      built-in theme is worn with ?theme=, with a background of its own; the
//      defaults reach what is drawn outside every theme (the presenter view); a :root rule of the
//      project's own wins over a default (and a default that is another token follows it), a
//      theme wins over that rule, and the picker's swatch of 'default' shows it; :root
//      { --ar-controls-accent } reaches the presenter view's docked controls, and its length
//      editor's shadow follows :root { --ar-presenter-bg }. On the fifth deck, IMPORTED (the theme
//      package's) is worn with no warning
//   5c. speaker notes, under the dev server, on the third deck: the v-steps inside Notes add no step
//      (the slide has two in the audience and in the presenter view), the presenter's panel shows
//      the notes of the slide on screen only (none from the preview), each step's own, and marks
//      what the step brings; a slide without notes says so; the export's notes pages print every
//      step of them, labelled
//   5d. the UI's language, under the dev server, on the third deck and the list: every other page
//      is opened in English (locale en-US); in a browser set to German, Japanese or Simplified
//      Chinese (zh-CN) the controls, the presenter view (its window title too), the notes pages
//      (the step labels, before and after the number) and the list of decks speak it and say so
//      (lang); in one set to a language with no catalogue (pt-BR), English
//   5e. Background and steps, under the dev server, on the playground's slide "A background": a
//      Background with v-step on it and one inside an element with v-step show in the slide's
//      background layer from their steps on, the slide counts those steps, and nothing warns
//   5f. the layouts' names, under the dev server: a layout file added to src/layouts while it runs
//      is in src/arao-layouts.d.ts, and out again once removed; an edit that changes no token
//      leaves the file untouched, one that reads a token more adds that parameter to it and to
//      the tokens module the dev server serves, one that writes a doc block its doc and its zone
//      (written as an editor that empties the file first does: the watcher reports the emptied
//      file and drops the events of the write, and the file still follows)
//   6. the talk's length, under the dev server, on the second deck (duration="15m"), in the
//      presenter's bar: 1h30 typed with real keys moves no slide and opens no jump menu, and the
//      countdown follows in an audience window too (useDeck()); after an apply from the keyboard,
//      Space moves the slides; an invalid length and one outside 1 min – 24 h show their error and
//      change nothing; after Escape, ArrowRight moves the slides; with the focus on the editor's
//      button no key moves them, and Tab out of the editor closes it; an open editor follows a
//      change made in another presenter window while nothing was typed in it, keeps typed text
//      otherwise, and says so; a reload keeps the length with no other window open, a new audience
//      window takes it, and its reset brings back the deck's 15:00 in every window. On the third
//      deck (no duration): none shown, one set adds the countdown, the reset removes it
//   7. the presenter window, under the dev server: "p" on /<second> opens /<second>?presenter,
//      and the two windows move together, either way; a window of the other deck does not
//   8. a deck's window beside the list, under the dev server: /<second>#/2/1 keeps its hash and
//      its timer while / is opened, and reloaded, in another window of the same browser
//   9. createDeckApp's other cases, under the dev server (vite.config.js and src/main.js rewritten
//      for each, and then put back). On a decks folder holding OVERFLOWING, at 1600x900: one
//      [arao] overflow warning at step 2 of its first slide and one at step 3, naming the deck,
//      the slide, its title, its step, the px (the same at both) and the fixes; none at step 1,
//      none again on coming back, none for its second slide (past its box by design); on its
//      third and fourth, two Slide.fit, a block too wide in px and a paragraph pulled past the left:
//      the body left whole, and the warning's fix says why (fit cannot shrink it; placed, not pushed). On a decks folder holding the second deck alone: it opens at
//      / and at its path, and windows at / and /<second> move together, either way, / staying /
//      ("p" at / opens /<second>?presenter); createDeckApp({ deckList: 'always' }) lists it at /,
//      with its cover; createDeckApp({ deckList: 'sometimes' }) opens it, with one [arao]
//      warning. On a decks folder holding a deck that lists a theme there is not before THEME, and
//      one that lists no theme there is: / lists them with no warning, their covers in THEME and
//      in default; each opens in that theme, with one [arao] warning. On a decks folder of 14
//      decks, at 390x844: the
//      covers far below the screen are not drawn until scrolled to; a deck that throws as it is
//      drawn says "No preview" (one [arao] warning); /café is shown as such, not
//      percent-encoded. On a decks folder holding a deck whose overlay slides give position and
//      scrim values they take and values they do not (one twice, a number out of its range): one
//      [arao] warning per value not taken, saying what it takes, none for the others
//  10. <bin> export                    no --deck: every deck, one PDF each, at its default name
//                                      (exports/<deck>.pdf); each PDF must have (its pages counted
//                                      in the file itself) as many pages as its summary line says
//                                      and as the walk counted steps (per step is the default), and
//                                      a total line all the decks; the fifth deck's says IMPORTED;
//                                      nothing said not to fit (DENSE's slides included)
//  11. <bin> export --deck <name> --per-slide   the one PDF (exports/<deck>-slides.pdf), with as
//                                      many pages as slides
//  12. <bin> export --url <a deck's URL>, against vite preview: a warning naming the base meant,
//      then it fails on the deck printed (the page says which); --url <a URL under which the
//      second deck opens>: fails on the deck printed, with no warning; both exit 1 and write
//      nothing
//  13. a site under a sub-path (vite.config.js with base: '/sub/', then put back): vite build writes
//      404.html; under vite preview /sub/ lists every deck at /sub/<name>, /sub/?deck=<name> is
//      moved to /sub/<name>, and the deck opens there; <bin> export --deck <name> prints it
//  14. the CLI's other cases, each on a decks folder of tiny decks of its own (vite.config.js
//      rewritten for each, and put back), with --out <folder> and several decks:
//        --url <vite preview of a site built under /talks/, with a deck Talks>: a warning (the
//        base is named like a deck), and every deck exported;
//        --theme THEME over a deck that lists it and one that does not (a symlink, next to a
//        dotfile deck that must not count): <deck>-THEME.pdf and <other>.pdf, whose line says it
//        fell back; --theme no deck lists: exit 1 and no PDF; a deck that throws at runtime: the
//        others exported, exit 1; decks that resolve to one file (Alpha in THEME and
//        alpha-THEME, Beta and beta): the first kept, the second failed, a warning on the case;
//        --theme IMPORTED (the theme package's) over a deck that lists it;
//        OVERFLOWING: its PDF written, exit 0, and at the end three slides listed as not fitting:
//        the first, steps 2-3 on one line, at the px the dev server said; the third and the fourth
//        with their own fix on their line; the usual fix once, last (the second slide not
//        listed); with --strict, the same and exit 1
// The package name and the CLI's name are read from package.json: nothing here names them.
//
// Environment:
//   ARAO_CHROMIUM=/path/to/chrome   a Chrome/Chromium to use, here and in the export, instead of
//                                   the one Playwright downloads for its version of
//                                   playwright-core (npx playwright-core install chromium)
//   SMOKE_KEEP=1                    keep the temporary project (its path is printed)
// Chromium's own needs (shared libraries, fonts: LD_LIBRARY_PATH, FONTCONFIG_FILE…) pass through
// to the browser and to the export as they are.
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, open, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lib = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
const PKG = lib.name
const BIN = typeof lib.bin === 'string' ? PKG.replace(/^@[^/]+\//, '') : Object.keys(lib.bin ?? {})[0]
if (!BIN) throw new Error('package.json has no "bin"')
const CONTENT = ['decks', 'images', 'snippets', 'layouts', 'slides'] // from the playground's src/
// a deck of the smoke project only: with the playground's, the project has several. MARK, its
// heading, tells it from the others once open. Faces keeps every useDeck() it is handed (one per
// drawing of the deck) in window.__faces, for the face check and the duration check (15 min:
// DURATION, in ms).
const MARK = 'A second deck'
// the smoke project's own theme, in src/themes/brand.css: the file's name is not the theme's (the
// plugin takes the names of its [data-theme="…"] selectors); its colours, as computed styles give
// them back, for the theme check
const THEME = 'sample'
const SAMPLE = { bg: 'rgb(16, 32, 48)', accent: 'rgb(233, 30, 99)' }
// the smoke project's shortcuts file (src/shortcuts.ts, loaded by the plugin): an added key in two
// cases (x, X), a code against a key for the same press (KeyQ → prev wins over q → next), a default
// remapped (End → first) and one turned off (PageUp)
const SHORTCUTS = `import { defineShortcuts } from '${PKG}'

export default defineShortcuts({ x: 'next', KeyQ: 'prev', q: 'next', End: 'first', PageUp: null })
`
// a web font THEME names in its font token: the build fetches it (vite/fonts.js, fontless) and
// writes its files under dist/assets/_fonts, unless the machine cannot reach the font provider.
// One no built-in theme names, so that its files are THEME's doing
const WEB_FONT = 'Lora'
const BRAND = ['brand.css', `/* the smoke project's own theme: a [data-theme] rule in src/themes, nothing to import */
@import './parts/extra.css';
[data-theme="${THEME}"] {
  --ar-bg: ${SAMPLE.bg};
  --ar-fg: rgb(240, 240, 240);
  --ar-accent: ${SAMPLE.accent};
  --ar-font-sans: "${WEB_FONT}", sans-serif;
}
`]
// a partial brand.css @import-s, with a theme of its own: the plugin follows the @import
const EXTRA = [`parts/extra.css`, `[data-theme="${THEME}-extra"] { --ar-accent: rgb(0, 150, 136); }
`]
// a theme from a package the project installs (a local one, vendor/<HALL_PKG>, depended on with
// file:), named in arao({ themes }): its CSS in css/, the folder its package.json names
const IMPORTED = 'hall'
const HALL = { bg: 'rgb(40, 20, 10)' }
const HALL_PKG = 'arao-hall-themes'
const HALL_FILES = {
  [`vendor/${HALL_PKG}/package.json`]: JSON.stringify({ name: HALL_PKG, version: '1.0.0', arao: { themes: 'css' } }, null, 2),
  [`vendor/${HALL_PKG}/css/hall.css`]: `[data-theme="${IMPORTED}"]{--ar-bg:${HALL.bg};--ar-fg:rgb(250, 240, 230)}\n`,
}
// a theme in a second folder of the project's, src/venues
const ROOM = 'room'
const ROOM_FILE = ['src/venues/room.css', `[data-theme="${ROOM}"] { --ar-accent: rgb(63, 81, 181); }
`]
// a scoped theme package linked from outside the project (as npm link or a workspace does): a
// symlink in node_modules to a folder next to the project, its CSS in themes/ (the default)
const LINKED = 'linked'
const LINKED_PKG = '@smoke/linked-themes'
// the plugin's theme sources, in order
const THEME_SOURCES = `themes: ['src/themes', 'src/venues', '${HALL_PKG}', '${LINKED_PKG}']`
const DURATION = 15 * 60000
// utility classes arao layouts --json must list (src/styles/utilities.css): one of each group
const UTILITY_CLASSES = ['cols', 'cols-2', 'rows', 'stack', 'row', 'middle', 'gap-sm', 'grow', 'text-lg', 'scale-80', 'accent', 'highlight', 'no-footer', 'fit']
// Its cover has a parameter of its layout, bound to a ref the page can change (window.__bar), the
// colour of its .bar (--ar-layout-cover-bar: BAR), and an attribute that is none (data-smoke)
const BAR = ['rgb(1, 2, 3)', 'rgb(4, 5, 6)']
const SECOND = ['Second.vue', `<template lang="pug">
Deck(:themes="['default', '${THEME}']" duration="15m")
  Faces
  Slide(layout="cover" :bar="bar" data-smoke="kept")
    .bar
    h1 ${MARK}
  Slide
    h2 Picked from the list
    p(v-step="2") Every deck of the project is a link on /.
</template>

<script setup>
import { ref } from 'vue'
import { useDeck } from '${PKG}'
const Faces = { setup: () => ((window.__faces ??= []).push(useDeck()), () => null) }
const bar = (window.__bar = ref('${BAR[0]}'))
</script>
`]

// a third deck of the smoke project only, with no duration (the countdown the presenter adds) and
// no themes listed (every theme there is); its second slide has notes with steps, one of them at a
// step the slide does not reach
const UNTIMED = ['Untimed.vue', `<template lang="pug">
Deck
  Slide(layout="cover")
    h1 A deck without duration
  Slide
    h2 No countdown
    p(v-step="2") Until the presenter sets one.
    Notes
      p.n1 Say there is no countdown.
      p.n2(v-step="2") Then set one.
      p.n3(v-step.collapse="3") Never shown: the slide has two steps.
</template>
`]

// a fourth deck of the smoke project only: a file name and a cover heading far too long for the
// one line each has in its card, which must cut them and stay as tall as the others; its first
// theme is THEME, which its cover wears
const LONG_HEADING = 'A cover heading just as long, far longer than the one line its card keeps for it under the title'
const LONG = ['TheDeckWhoseFileName-is_so-long-that-no-card-of-the-list-could-ever-hold-it-on-one-line.vue', `<template lang="pug">
Deck(:themes="['${THEME}', 'default']")
  Slide(layout="cover")
    h1 ${LONG_HEADING}
  Slide
    h2 A long name
    p(v-step="2") Cut in the list, whole here.
</template>
`]

// a fifth deck of the smoke project only: it lists IMPORTED, the theme package's, first
const VENUE = ['Venue.vue', `<template lang="pug">
Deck(:themes="['${IMPORTED}', 'default']")
  Slide(layout="cover")
    h1 A deck in a theme of its own
  Slide
    h2 From a theme package
    p(v-step="2") Listed, so worn.
</template>
`]

// a sixth deck of the smoke project only: its first slide, of the default layout, holds an Agenda
// (on the slide at place 0) that lists its sections, the first one current, in its window and in
// the list's thumbnail, where the sections draw nothing but their titles (OUTLINE_ITEMS); its
// second a hand-written ol.agenda, which looks like it, with no state; then its three sections,
// each with an Agenda too, as a talk shows its progress on each (the second one's, done, current
// and upcoming, legible in every built-in theme: OUTLINE_SECTION). No theme listed: it offers
// every built-in one
const OUTLINE = ['Outline.vue', `<template lang="pug">
Deck
  Slide
    h2 An outline first
    Agenda
  Slide
    h2 Written by hand
    ol.agenda
      li Part one
      li Part two
  Slide(layout="section")
    h1 Part one
    Agenda
  Slide(layout="section")
    h1 #[Icon(name="lucide:rocket")] Part two
    Agenda
  Slide(layout="section")
    h1 Part three
    Agenda
</template>
`]
const OUTLINE_ITEMS = 'Part one:current, Part two:upcoming, Part three:upcoming'
// the outline's section whose Agenda shows the three states (its number), and the contrast each
// item's text and number must keep on it, against the background beside them: 3:1, large text's
const OUTLINE_SECTION = 4
const SECTION_CONTRAST = 3

// a seventh deck of the smoke project only, crowded slides that must fit (DENSE_SLIDES, by title):
// grids of 11, 12 and 13 blocks (an icon, a title and a one-line description each: the grid's
// own sizes step down with the count), a Slide.fit whose list does not fit at the body's size
// (fitted), a Slide.scale-80, a Slide.fit holding an Agenda of its ten sections (DENSE_SECTIONS:
// its rows are sized from the title's tokens, not from the body's text) and a Slide.fit of grid
// whose pictures are given a size in px (icon-size, DENSE_ICON): neither fits whole, and fit
// shrinks them too. No theme listed: it is checked in every built-in one (4f)
const DENSE_BLOCKS = [
  ['lucide:file-code', 'One Vue file', 'Slides as components'], ['lucide:monitor', 'Any screen', 'One canvas, scaled'],
  ['lucide:printer', 'And a PDF', 'Every step a page'], ['lucide:palette', 'Themes', 'Tokens, not CSS'],
  ['lucide:presentation', 'Presenter', 'Notes and timer'], ['lucide:code', 'Snippets', 'Lit up by step'],
  ['lucide:image', 'Pictures', 'Fitted to their box'], ['lucide:layout-grid', 'Layouts', 'One CSS file each'],
  ['lucide:footprints', 'Steps', 'Reveal one by one'], ['lucide:keyboard', 'Shortcuts', 'Keys of your own'],
  ['lucide:languages', 'Languages', 'The UI in yours'], ['lucide:share-2', 'Sync', 'Windows in step'],
  ['lucide:timer', 'Timer', 'The talk on time'],
]
const DENSE_SLIDES = {
  grids: ['11 blocks', '12 blocks', '13 blocks'], fit: 'Fitted to the slide', scaled: 'A step down',
  agenda: 'The whole talk', icons: 'Pictures given a size',
}
const DENSE_SECTIONS = ['Why we started', 'The first prototype', 'What broke', 'Rewriting the core', 'Themes as tokens',
  'Layouts in CSS', 'Measuring overflow', 'Exporting to PDF', 'What users asked for', 'What comes next']
const DENSE_ICON = 300
const DENSE = ['Dense.vue', `<template lang="pug">
Deck
  Slide(v-for="n in [11, 12, 13]" :key="n" layout="grid")
    h2 {{ n }} blocks
    div(v-for="b in blocks.slice(0, n)" :key="b[1]")
      Icon(:name="b[0]")
      h3 {{ b[1] }}
      p {{ b[2] }}
  Slide.fit
    h2 ${DENSE_SLIDES.fit}
    ul
      li(v-for="i in 15" :key="i") Item {{ i }}, on a line of its own
  Slide.scale-80
    h2 ${DENSE_SLIDES.scaled}
    p Its body at 80% of its size
  Slide.fit
    h2 ${DENSE_SLIDES.agenda}
    Agenda
  Slide.fit(layout="grid" icon-size="${DENSE_ICON}px")
    h2 ${DENSE_SLIDES.icons}
    div(v-for="b in blocks.slice(0, 8)" :key="b[1]")
      Icon(:name="b[0]")
      h3 {{ b[1] }}
      p {{ b[2] }}
  Slide(v-for="t in sections" :key="t" layout="section")
    h1 {{ t }}
</template>

<script setup>
const blocks = ${JSON.stringify(DENSE_BLOCKS).replace(/"/g, "'")}
const sections = ${JSON.stringify(DENSE_SECTIONS).replace(/"/g, "'")}
</script>
`]

// a deck of a decks folder of its own (src/overflowing), for the overflow warnings: a footer, and
// a list too long for its slide from step 2 on, alike at step 3 (what step 3 brings changes no
// size: a word inside the first item); its second slide reaches past its box only by design (a
// Background, an element positioned absolutely, one marked data-ar-bleed), and is no overflow; its
// third, a Slide.fit, holds a block too wide in px (shrinking the text does not help: fit leaves it
// whole, and says so); its fourth, a Slide.fit too, a paragraph pulled past the left edge (placed,
// not pushed: fit does nothing, the fix is to mark it or move it)
const OVERFLOWING = ['Overflowing.vue', `<template lang="pug">
Deck
  template(#footer)
    span Overflowing
  Slide
    h2 Too long from step 2
    ul
      li Item 1 #[span(v-step="3") and a word at step 3]
      li(v-for="i in 5" :key="i") Item {{ i + 1 }}
      li(v-for="i in 9" :key="'more' + i" v-step="2") More {{ i }}
  Slide
    Background(src="shapes.svg" opacity="0.2")
    h2 Past its box by design
    div(style="position: absolute; right: -300px; top: -200px; width: 600px; height: 600px; border-radius: 50%; background: currentColor; opacity: .1")
    div(data-ar-bleed style="margin: 0 -400px; height: 40px; background: currentColor; opacity: .2")
    p A decoration reaches past the edge on purpose.
  Slide.fit
    h2 Too wide for fit
    div(style="width: 2200px; height: 40px; background: currentColor; opacity: .2")
  Slide.fit
    h2 Pulled to the left
    p(style="margin-left: -300px") Past the left edge
</template>
`]
const OVERFLOW_TITLE = 'Too long from step 2'

// the first theme each deck's cover wears in the list, by deck name, and its canvas's background
// (SAMPLE's, HALL's; null: default's, whatever it is)
const COVER_THEMES = { [basename(LONG[0], '.vue')]: [THEME, SAMPLE.bg], Venue: [IMPORTED, HALL.bg] }

// the title each deck's card must show, its file name in words, written out (not worked out the
// way the engine does): words split at a lower-to-upper case change and at - and _, the first
// letter upper case
const TITLES = {
  Playground: 'Playground',
  Second: 'Second',
  Untimed: 'Untimed',
  Venue: 'Venue',
  Outline: 'Outline',
  Dense: 'Dense',
  [basename(LONG[0], '.vue')]: 'The Deck Whose File Name is so long that no card of the list could ever hold it on one line',
}

const log = (msg) => console.log(`\n[smoke] ${msg}`)
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const problems = []
const fail = (msg) => {
  problems.push(msg)
  console.error(`[smoke] FAIL ${msg}`)
}

// runs a command, its output shown as it comes; resolves to { code, out, err } (stdout, stderr)
function exec(cmd, args, cwd) {
  return new Promise((ok, ko) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
      process.stdout.write(d)
    })
    child.stderr.on('data', (d) => {
      err += d
      process.stderr.write(d)
    })
    child.on('error', ko)
    child.on('close', (code) => ok({ code, out, err }))
  })
}
// the same, failing unless it exits with 0; resolves to its stdout
async function run(cmd, args, cwd) {
  const { code, out } = await exec(cmd, args, cwd)
  if (code !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${code}`)
  return out
}

const freePort = () => new Promise((ok, ko) => {
  const s = createServer().once('error', ko).listen(0, '127.0.0.1', () => {
    const { port } = s.address()
    s.close(() => ok(port))
  })
})

let project
let server
let browser
async function cleanup() {
  await browser?.close().catch(() => {})
  if (server && server.exitCode == null) server.kill()
  if (project && !process.env.SMOKE_KEEP) await rm(project, { recursive: true, force: true })
  if (project && !process.env.SMOKE_KEEP) await rm(`${project}-linked`, { recursive: true, force: true })
}

try {
  project = await mkdtemp(join(tmpdir(), `${BIN}-smoke-`))
  log(`project: ${project}`)

  // the tarball: the one given, or a fresh one
  let tarball = process.argv[2] && resolve(process.argv[2])
  if (!tarball) {
    log('packing the library')
    await run('npm', ['pack', '--pack-destination', project], repo)
    const packed = (await readdir(project)).find((f) => f.endsWith('.tgz'))
    if (!packed) throw new Error('npm pack made no tarball')
    tarball = join(project, packed)
  }
  await stat(tarball)

  // the slides project, as a user would write it
  const dev = lib.devDependencies ?? {}
  if (!dev.vite || !dev.vue) throw new Error('vite and vue must be devDependencies of the library')
  const files = {
    'package.json': JSON.stringify({
      name: 'smoke-slides',
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', export: `${BIN} export` },
      dependencies: { [PKG]: `file:${tarball}`, [HALL_PKG]: `file:./vendor/${HALL_PKG}`, vite: dev.vite, vue: dev.vue },
    }, null, 2),
    'vite.config.js': `import { defineConfig } from 'vite'\nimport arao from '${PKG}/vite'\n\nexport default defineConfig({ plugins: [arao({ ${THEME_SOURCES} })] })\n`,
    'index.html': `<!doctype html>\n<html lang="en">\n  <head><meta charset="UTF-8" /><title>smoke</title></head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>\n`,
    'src/main.js': `import { createDeckApp } from '${PKG}'\n\ncreateDeckApp().mount('#app')\n`,
    'src/shortcuts.ts': SHORTCUTS,
    [`src/themes/${BRAND[0]}`]: BRAND[1],
    [`src/themes/${EXTRA[0]}`]: EXTRA[1],
    [ROOM_FILE[0]]: ROOM_FILE[1],
    ...HALL_FILES,
  }
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(project, name)), { recursive: true })
    await writeFile(join(project, name), text)
  }
  for (const dir of CONTENT) {
    const from = join(repo, 'playground', 'src', dir)
    if (await stat(from).catch(() => null)) await cp(from, join(project, 'src', dir), { recursive: true })
  }
  await mkdir(join(project, 'src', 'decks'), { recursive: true })
  await writeFile(join(project, 'src', 'decks', SECOND[0]), SECOND[1])
  await writeFile(join(project, 'src', 'decks', UNTIMED[0]), UNTIMED[1])
  await writeFile(join(project, 'src', 'decks', LONG[0]), LONG[1])
  await writeFile(join(project, 'src', 'decks', VENUE[0]), VENUE[1])
  await writeFile(join(project, 'src', 'decks', OUTLINE[0]), OUTLINE[1])
  await writeFile(join(project, 'src', 'decks', DENSE[0]), DENSE[1])
  const decks = (await readdir(join(project, 'src', 'decks'))).filter((f) => f.endsWith('.vue')).map((f) => basename(f, '.vue'))
  if (decks.length < 2) throw new Error('the project needs two decks or more to test the selector')
  log(`decks: ${decks.join(', ')}`)
  // the library's built-in themes, as the installed package ships them (themes/<name>.css, each
  // file naming its theme): offered first, 'default' leading, the others by name
  const builtins = async () => {
    const names = (await readdir(join(project, 'node_modules', PKG, 'themes')).catch(() => []))
      .filter((f) => f.endsWith('.css')).map((f) => basename(f, '.css')).sort()
    return names.includes('default') ? ['default', ...names.filter((n) => n !== 'default')] : names
  }

  log('npm install')
  await run('npm', ['install', '--no-audit', '--no-fund'], project)
  // the linked package: outside the project, symlinked into its node_modules
  const linked = `${project}-linked`
  await mkdir(join(linked, 'themes'), { recursive: true })
  await writeFile(join(linked, 'package.json'), JSON.stringify({ name: LINKED_PKG, version: '1.0.0' }))
  await writeFile(join(linked, 'themes', 'linked.css'), `[data-theme="${LINKED}"] { --ar-accent: rgb(121, 85, 72); }\n`)
  await mkdir(join(project, 'node_modules', '@smoke'), { recursive: true })
  await symlink(linked, join(project, 'node_modules', LINKED_PKG), 'dir')

  // the project's own Vite and Playwright, as installed with the package
  const need = createRequire(join(project, 'package.json'))
  const viteJson = need.resolve('vite/package.json')
  const viteBin = join(dirname(viteJson), JSON.parse(await readFile(viteJson, 'utf8')).bin.vite)
  const { chromium } = need('playwright-core')

  // the web font THEME names, and the defaults' (the first family of each --ar-font-* token the
  // engine's CSS names in quotes: tokens.css's Gelasio): their files in the build (assets/_fonts),
  // their @font-face in the CSS (THEME's 400 and 700; the defaults' 400, 600 and 700, upright and
  // italic). Only where the font provider can be reached (an offline machine
  // builds without them: the check says SKIPPED). Then builds of their own (into dist-fonts,
  // removed after): with arao({ fonts: false }), which writes no font files; with a themes folder
  // whose fonts are all system fonts (SYSTEM) and builtinThemes: false, whose CSS has no
  // @font-face but for the defaults' families and which says nothing about fonts (online); with
  // that folder and one built-in theme (builtinThemes: [name]), whose CSS has no @font-face but for
  // that theme's families and the defaults'; and with a name that is no built-in theme, which
  // stops
  async function webFonts() {
    const reachable = async () => {
      for (let i = 0; i < 3; i++) {
        const ok = await fetch('https://fonts.google.com/metadata/fonts', { method: 'HEAD', signal: AbortSignal.timeout(10000) }).then((r) => r.ok, () => false)
        if (ok) return true
        await new Promise((r) => setTimeout(r, 2000))
      }
      return false
    }
    const fontFiles = async (dist) => (await readdir(join(project, dist, 'assets', '_fonts')).catch(() => [])).filter((f) => f.endsWith('.woff2'))
    const cssOf = async (dist) => (await Promise.all((await readdir(join(project, dist, 'assets'))).filter((f) => f.endsWith('.css')).map((f) => readFile(join(project, dist, 'assets', f), 'utf8')))).join('\n')
    // the families a build's CSS gives an @font-face (not the fallbacks fontless adds)
    const facesIn = async (dist) => new Set([...(await cssOf(dist)).matchAll(/@font-face\s*{[^}]*?font-family:\s*["']?([^;"']+)["']?\s*;/g)].map((m) => m[1].trim()).filter((f) => !/Fallback/.test(f)))
    const quotedFamilies = (css) => [...css.matchAll(/--ar-font-[a-z]+:\s*"([^"]+)"/g)].map((m) => m[1])
    const defaults = quotedFamilies(await readFile(join(project, 'node_modules', PKG, lib.exports['./style.css']), 'utf8'))
    const online = (await fontFiles('dist')).length > 0 || (await reachable())
    if (!online) log('web fonts: SKIPPED: no network (the font provider cannot be reached from here)')
    else if (!(await fontFiles('dist')).length) fail(`vite build: no web font files for ${[WEB_FONT, ...defaults].join(', ')} in dist/assets/_fonts`)
    else {
      // each @font-face of the build: its family, the weights it covers (one, or a variable
      // font's range) and its style (normal where unset)
      const faces = [...(await cssOf('dist')).matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => {
        const prop = (name) => m[1].match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].trim()
        const [lo, hi = lo] = (prop('font-weight') ?? '400').split(/\s+/).map(Number)
        return { family: (prop('font-family') ?? '').replace(/^["']|["']$/g, ''), lo, hi, style: prop('font-style') ?? 'normal' }
      })
      const expect = (family, weights, styles) => {
        if (!faces.some((f) => f.family === family)) return fail(`vite build: no @font-face for "${family}" in the built CSS`)
        for (const weight of weights) {
          for (const style of styles) {
            if (!faces.some((f) => f.family === family && f.lo <= weight && weight <= f.hi && f.style === style)) fail(`vite build: no ${weight} ${style} face of "${family}" (the browser would fake it)`)
          }
        }
      }
      expect(WEB_FONT, [400, 700], ['normal'])
      // the defaults' fonts: every weight and style the plugin fetches (vite/fonts.js)
      for (const family of defaults) expect(family, [400, 600, 700], ['normal', 'italic'])
    }
    const config = (options) => `import { defineConfig } from 'vite'\nimport arao from '${PKG}/vite'\n\nexport default defineConfig({ plugins: [arao(${options})], build: { outDir: 'dist-fonts' } })\n`
    await writeFile(join(project, 'vite.fonts.config.js'), config('{ fonts: false }'))
    await run(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if ((await fontFiles('dist-fonts')).length) fail('vite build with arao({ fonts: false }): font files in dist-fonts/assets/_fonts')
    await mkdir(join(project, 'src', 'themes-system'), { recursive: true })
    const SYSTEM = ['Arial', 'Helvetica', 'Segoe UI', 'Menlo', 'Consolas']
    await writeFile(join(project, 'src', 'themes-system', 'plain.css'), `[data-theme="plain"] { --ar-font-sans: ${SYSTEM.slice(0, 3).map((f) => JSON.stringify(f)).join(', ')}, sans-serif; --ar-font-mono: ${SYSTEM.slice(3).join(', ')}, monospace; }\n`)
    await writeFile(join(project, 'vite.fonts.config.js'), config(`{ themes: 'src/themes-system', builtinThemes: false }`))
    const { code, out, err } = await exec(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if (code !== 0) fail(`vite build with system fonts only and builtinThemes: false exited with ${code}`)
    else {
      const others = [...(await facesIn('dist-fonts'))].filter((f) => !defaults.includes(f))
      if (others.length) fail(`vite build with system fonts only and builtinThemes: false: @font-face for ${others.join(', ')}, which neither the defaults nor the project's themes name as a web font`)
    }
    if (online && /\[fontless\]|\[arao\] fonts/.test(out + err)) fail(`vite build with system fonts only and builtinThemes: false: something said about fonts:\n${(out + err).split('\n').filter((l) => /\[fontless\]|\[arao\] fonts/.test(l)).join('\n')}`)
    // one built-in theme: no @font-face but for its families (the first of each of its --ar-font-*)
    // and the defaults'
    const one = (await builtins())[1]
    const families = [...quotedFamilies(await readFile(join(project, 'node_modules', PKG, 'themes', `${one}.css`), 'utf8')), ...defaults]
    await writeFile(join(project, 'vite.fonts.config.js'), config(`{ themes: 'src/themes-system', builtinThemes: [${JSON.stringify(one)}] }`))
    const subset = await exec(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if (subset.code !== 0) fail(`vite build with builtinThemes: ["${one}"] exited with ${subset.code}`)
    else {
      const faces = await facesIn('dist-fonts')
      const others = [...faces].filter((f) => !families.includes(f))
      if (others.length) fail(`vite build with builtinThemes: ["${one}"]: @font-face for ${others.join(', ')}, which neither ${one} nor the defaults name`)
      else console.log(`  builtinThemes: ["${one}"]: @font-face for ${[...faces].join(', ') || 'nothing (no network)'} only`)
    }
    await writeFile(join(project, 'vite.fonts.config.js'), config(`{ builtinThemes: ['nosuch'] }`))
    const bad = await exec(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if (bad.code === 0 || !/\[arao\] builtinThemes: no built-in theme "nosuch"/.test(bad.out + bad.err)) fail(`vite build with builtinThemes: ['nosuch']: exited with ${bad.code}, without saying there is no such built-in theme`)
    await Promise.all(['vite.fonts.config.js', 'dist-fonts', 'src/themes-system'].map((p) => rm(join(project, p), { recursive: true, force: true })))
  }

  // the build's 404.html: a copy of its index.html (static hosts answer a deck's path with it)
  async function notFoundPage(what) {
    const [index, page] = await Promise.all(['index.html', '404.html'].map((f) => readFile(join(project, 'dist', f), 'utf8').catch(() => null)))
    if (page == null) fail(`${what}: no dist/404.html`)
    else if (page !== index) fail(`${what}: dist/404.html is not a copy of dist/index.html`)
  }

  log('vite build')
  await run(process.execPath, [viteBin, 'build'], project)
  await notFoundPage('vite build')
  await webFonts()

  // theme sources the build turns down, or warns about: a package not installed, one that gives no
  // theme, one whose package.json names a folder outside it, a bare name that is a folder at the
  // root (the "./" hint); a name two sources give (one warning, the build passes), and a source
  // named twice ('src/themes' and './src/themes': no warning about its own names)
  {
    const config = files['vite.config.js']
    const fake = async (name, meta, css) => {
      const dir = join(project, 'node_modules', name)
      await mkdir(join(dir, 'themes'), { recursive: true })
      await writeFile(join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', ...meta }))
      await writeFile(join(dir, 'themes', 'shared.css'), css)
    }
    await fake('arao-empty-themes', {}, ':root { --x: 1; }\n')
    await fake('arao-escape-themes', { arao: { themes: '../../src/themes' } }, '[data-theme="x"] {}\n')
    await mkdir(join(project, 'src', 'dupes'), { recursive: true })
    await writeFile(join(project, 'src', 'dupes', 'room.css'), `[data-theme="${ROOM}"] { --ar-accent: rgb(1, 1, 1); }\n`)
    // a project theme named like a built-in one: it replaces it (the built-in file is not loaded),
    // and a message says so; a project's own default says nothing (the built-in one sets no token)
    const over = (await builtins())[1]
    await mkdir(join(project, 'src', 'over'), { recursive: true })
    await writeFile(join(project, 'src', 'over', 'mine.css'), `[data-theme="${over}"] { --ar-accent: rgb(2, 2, 2); }\n[data-theme="default"] { --ar-accent: rgb(3, 3, 3); }\n`)
    const cases = [
      { add: ['arao-no-such-themes'], says: /\[arao\] themes: no package "arao-no-such-themes" installed/ },
      { add: ['arao-empty-themes'], says: /\[arao\] themes: package "arao-empty-themes" gives no theme/ },
      { add: ['arao-escape-themes'], says: /\[arao\] themes: package "arao-escape-themes" names "\.\.\/\.\.\/src\/themes" .*must be a folder inside the package/ },
      { add: ['vendor'], says: /\[arao\] themes: "vendor" is read as a package's name.*There is a folder "vendor" at the root: write "\.\/vendor"/ },
      { add: ['./src/dupes', './src/themes'], passes: true, says: new RegExp(`\\[arao\\] theme "${ROOM}" is in src/venues and in \\./src/dupes: it is offered once; both apply`), not: /\[arao\] theme "sample/ },
      // and the library's own package named as a source adds nothing (its folder is there already)
      { add: ['./src/over', PKG], passes: true, says: new RegExp(`\\[arao\\] theme "${over}" of \\./src/over replaces the built-in one`), not: new RegExp(`\\[arao\\] theme "(?!${over}")`),
        // the built-in file's own background is nowhere in the built CSS
        check: async () => {
          const bg = (await readFile(join(project, 'node_modules', PKG, 'themes', `${over}.css`), 'utf8')).match(/--ar-bg:\s*(#[0-9a-f]+)/i)?.[1]
          const assets = join(project, 'dist', 'assets')
          const css = (await Promise.all((await readdir(assets)).filter((f) => f.endsWith('.css')).map((f) => readFile(join(assets, f), 'utf8')))).join('\n')
          return !bg ? `themes/${over}.css sets no --ar-bg to look for` : css.toLowerCase().includes(bg.toLowerCase()) ? `the built-in ${over}'s CSS (--ar-bg: ${bg}) is in the build` : null
        } },
    ]
    try {
      let problem
      for (const c of cases) {
        const what = `vite build with the theme sources + ${c.add.join(', ')}`
        await writeFile(join(project, 'vite.config.js'), config.replace(`'${HALL_PKG}'`, `'${HALL_PKG}', ${c.add.map((a) => `'${a}'`).join(', ')}`))
        const { code, out, err } = await exec(process.execPath, [viteBin, 'build'], project)
        const said = out + err
        if (c.passes ? code !== 0 : code === 0) fail(`${what}: exited with ${code}`)
        else if (!c.says.test(said)) fail(`${what}: nothing matching ${c.says}`)
        else if (c.not?.test(said)) fail(`${what}: says ${c.not}`)
        else if (c.check && (problem = await c.check())) fail(`${what}: ${problem}`)
        else console.log(`  theme sources + ${c.add.join(', ')}: ${c.passes ? 'builds, saying so once' : 'the build stops, saying why'}`)
      }
    } finally {
      await writeFile(join(project, 'vite.config.js'), config)
      for (const p of ['arao-empty-themes', 'arao-escape-themes']) await rm(join(project, 'node_modules', p), { recursive: true, force: true })
      await rm(join(project, 'src', 'dupes'), { recursive: true, force: true })
      await rm(join(project, 'src', 'over'), { recursive: true, force: true })
    }
    await run(process.execPath, [viteBin, 'build'], project) // the project's own build back in dist/
  }

  // an interface of the file the plugin wrote for the editor and vue-tsc (src/arao-layouts.d.ts):
  // its body, from its first line to the one closing it; null when there is no such file or no such
  // interface
  const typedInterface = async (name) => {
    const text = await readFile(join(project, 'src', 'arao-layouts.d.ts'), 'utf8').catch(() => '')
    return text.match(new RegExp(`^ {2}interface ${name} \\{\\n([\\s\\S]*?)^ {2}\\}$`, 'm'))?.[1] ?? null
  }
  // a layout's entry in one of its interfaces: the lines of its members; null when it has none
  const typedEntry = (body, name) => body?.match(new RegExp(`^ {4}'${name}': \\{\\n([\\s\\S]*?)^ {4}\\}$`, 'm'))?.[1] ?? null
  // the layouts' names it typed (ProjectLayouts), sorted as the plugin sorts them; null when there
  // is no such file
  const typedLayouts = async () => {
    const body = await typedInterface('ProjectLayouts')
    return body == null ? null : [...body.matchAll(/^ {4}'([^']+)': /gm)].map((m) => m[1]).join(', ')
  }
  // and the parameters it typed for one of them (camelCase, as written there), each followed by
  // its type in brackets when it is not a string (its values: tone ('light' | 'dark')); null when
  // none
  const typedParams = async (name) => {
    const entry = typedEntry(await typedInterface('ProjectLayouts'), name)
    return entry == null ? null : [...entry.matchAll(/^ {6}(\w+)\?: (.+)$/gm)]
      .filter((m) => m[1] !== 'layout').map((m) => (m[2] === 'string' ? m[1] : `${m[1]} (${m[2]})`)).join(', ')
  }
  // and the zones it typed for one of them (ProjectLayoutZones); '' for none, null when not typed
  const typedZones = async (name) => {
    const body = await typedInterface('ProjectLayoutZones')
    if (body?.includes(`\n    '${name}': {}\n`) || body?.startsWith(`    '${name}': {}\n`)) return ''
    const entry = typedEntry(body, name)
    return entry == null ? null : [...entry.matchAll(/^ {6}([\w$]+|'[^']+'): true$/gm)].map((m) => m[1]).join(', ')
  }
  const ownLayouts = async () => (await readdir(join(project, 'src', 'layouts')).catch(() => [])).filter((f) => f.endsWith('.css')).map((f) => basename(f, '.css')).sort()

  // layouts: the library's (the installed package's layouts/) and the project's (src/layouts, the
  // playground's epigraph.css) are in the build; a project file named like a library one replaces it
  // (a message says so, and the library file's CSS is not in the build); a file whose name is no
  // layout's, and one that names no .layout-<name>, are loaded, each with a warning. Each build
  // writes the project's layouts' names (valid ones only) into src/arao-layouts.d.ts
  {
    const builtCss = async () => {
      const assets = join(project, 'dist', 'assets')
      return (await Promise.all((await readdir(assets)).filter((f) => f.endsWith('.css')).map((f) => readFile(join(assets, f), 'utf8')))).join('\n')
    }
    const library = (await readdir(join(project, 'node_modules', PKG, 'layouts'))).filter((f) => f.endsWith('.css')).map((f) => basename(f, '.css'))
    const own = await ownLayouts()
    let css = await builtCss()
    const missing = [...library, ...own].filter((n) => !css.includes(`.layout-${n}`))
    let typed = await typedLayouts()
    if (!library.length || !own.length) fail(`layouts: ${library.length} in the package's layouts/, ${own.length} in src/layouts (the playground's): both are wanted`)
    else if (missing.length) fail(`vite build: no CSS for the layouts ${missing.join(', ')} in the build`)
    else if (typed !== own.join(', ')) fail(`vite build: src/arao-layouts.d.ts ${typed == null ? 'not written' : `lists ${typed || 'no layout'}`}, not ${own.join(', ')}`)
    else console.log(`  layouts: ${library.join(', ')} (the library's) and ${own.join(', ')} (the project's) in the build, and the project's in src/arao-layouts.d.ts`)
    // the playground's epigraph.css reads --ar-layout-epigraph-footer, -mark and -size: its
    // parameters; it places no zone
    const epigraph = await typedParams('epigraph')
    const epigraphZones = await typedZones('epigraph')
    if (epigraph !== 'footer, mark, size') fail(`vite build: src/arao-layouts.d.ts types epigraph's parameters as ${epigraph ?? 'nothing'}, not footer, mark, size`)
    else if (epigraphZones !== '') fail(`vite build: src/arao-layouts.d.ts types epigraph's zones as ${epigraphZones ?? 'nothing'}, not none`)
    else console.log(`  layout parameters: epigraph's (${epigraph}) in src/arao-layouts.d.ts, and its zones (none)`)
    // the project's cover replaces the library's, its parameters too: pad, not bar, footer and
    // title-size; its --ar-layout-cover-title is none (title is an HTML attribute), with a warning.
    // Its doc block, after a licence header, names a zone (aside), and its CSS styles another
    // (badge): its zones are both, not caption (a rule of split's); its example keeps a Pug line
    // starting with @; its @param nope names no token, with a warning, and a /** comment after its
    // code is no doc block, with a problem; a rule of it writes a literal colour, #c0ffee, no theme
    // token (vite/layout-literals.js), with a warning and a problem
    const COVER_DOC = ['The smoke project\'s own cover.', 'Slide(layout="cover" pad="20px")\n  h1 Hello\n  button(\n    @click="next"\n  ) Next', 'a note beside the title', 'the slide\'s padding', 'its colours']
    const added = {
      'cover.css': `/* smoke licence header */
/**
 * ${COVER_DOC[0]}
 * @example
${COVER_DOC[1].split('\n').map((l) => ` * ${l}`).join('\n')}
 * @zone aside  ${COVER_DOC[2]}
 * @param pad   ${COVER_DOC[3]}
 * @param tone  {light|dark} ${COVER_DOC[4]}
 * @param nope  no token of the layout
 */
.layout-cover { --smoke-own-cover: 1; padding: var(--ar-layout-cover-pad, 0); --smoke-tone: var(--ar-layout-cover-tone, light); color: var(--ar-layout-cover-title, inherit); }
.layout-cover > .ar-zone-badge { order: -1; color: #c0ffee; }
.layout-split .ar-zone-caption { order: 1; }
/** not read */
`,
      'bad name.css': '.x { --smoke-bad: 1; }\n',
      'plain.css': ':root { --smoke-plain: 1; }\n',
    }
    try {
      for (const [f, text] of Object.entries(added)) await writeFile(join(project, 'src', 'layouts', f), text)
      const { code, out, err } = await exec(process.execPath, [viteBin, 'build'], project)
      const said = out + err
      css = await builtCss()
      typed = await typedLayouts()
      const named = [...own, 'cover', 'plain'].sort().join(', ') // not "bad name": no slide can name it
      const what = 'vite build with src/layouts/cover.css, "bad name.css" and plain.css'
      if (code !== 0) fail(`${what}: exited with ${code}`)
      else if (typed !== named) fail(`${what}: src/arao-layouts.d.ts lists ${typed ?? 'nothing'}, not ${named}`)
      else if (!/\[arao\] layout "cover" of src\/layouts\/cover\.css replaces the library's one/.test(said)) fail(`${what}: nothing says the project's cover replaces the library's`)
      else if (!/\[arao\] src\/layouts\/bad name\.css: "bad name" is no layout's name/.test(said)) fail(`${what}: no warning about "bad name"`)
      else if (!/\[arao\] src\/layouts\/plain\.css: it names no \.layout-plain/.test(said)) fail(`${what}: no warning about plain.css`)
      else if (!/\[arao\] src\/layouts\/cover\.css: --ar-layout-cover-title is no attribute of Slide\(layout="cover"\): "title" is an HTML attribute/.test(said)) fail(`${what}: no warning that --ar-layout-cover-title is no attribute`)
      else if (said.match(/--ar-layout-cover-title is no attribute/g).length !== 1) fail(`${what}: the warning about --ar-layout-cover-title is given ${said.match(/--ar-layout-cover-title is no attribute/g).length} times, not once`)
      else if ((typed = await typedParams('cover')) !== "pad, tone ('light' | 'dark')") fail(`${what}: src/arao-layouts.d.ts types cover's parameters as ${typed ?? 'nothing'}, not pad and tone, 'light' | 'dark' (the project's, which replace the library's; tone's values its doc block's {light|dark})`)
      else if ((typed = await typedZones('cover')) !== 'aside, badge') fail(`${what}: src/arao-layouts.d.ts types cover's zones as ${typed ?? 'nothing'}, not aside, badge (its @zone, then what its CSS styles)`)
      else if (!typedEntry(await typedInterface('ProjectLayouts'), 'cover')?.includes(COVER_DOC[0])) fail(`${what}: src/arao-layouts.d.ts does not carry cover's doc ("${COVER_DOC[0]}")`)
      else if (said.match(/\[arao\] src\/layouts\/cover\.css: line \d+, color: #c0ffee is a literal colour/g)?.length !== 1) fail(`${what}: the warning that cover.css writes a literal colour (#c0ffee) is given ${said.match(/#c0ffee is a literal colour/g)?.length ?? 0} times, not once`)
      else if (said.match(/\[arao\] src\/layouts\/cover\.css: @param nope names no token of the layout/g)?.length !== 1) fail(`${what}: the warning that cover.css's @param nope names no token is given ${said.match(/@param nope names no token/g)?.length ?? 0} times, not once`)
      else if (!['--smoke-own-cover', '--smoke-bad', '--smoke-plain'].every((t) => css.includes(t))) fail(`${what}: the project's files are not all in the build`)
      else if (css.includes('--_ar-cover-bar')) fail(`${what}: the library's cover.css is in the build`)
      else console.log('  layouts: a project cover replaces the library\'s, saying so, its parameters too (one typed as its values), its zones and its doc typed; a token named as an HTML attribute, a @param naming no token and a literal colour warn once; a file with a bad name, and one naming no layout, warn and load; the valid names are typed')

      // arao layouts, with those files: every layout the project has, each with its doc. As JSON
      // (the config printing a line as it loads: on stderr, the JSON alone on stdout), with the
      // araojs version: default, the library's (but cover, which the project's replaces), every
      // file of the project's folder ("bad name" too, which no slide can name); the library's
      // documented in full, the playground's epigraph with its doc block, the project's cover as its
      // doc block says, plain with none and its problem
      log(`${BIN} layouts --json`)
      const viteConfig = join(project, 'vite.config.js')
      const config = await readFile(viteConfig, 'utf8')
      const HELLO = 'smoke: the config says hello as it loads'
      let json
      try {
        await writeFile(viteConfig, `console.log(${JSON.stringify(HELLO)})\n${config}`)
        json = await exec('npx', ['--no-install', BIN, 'layouts', '--json'], project)
      } finally {
        await writeFile(viteConfig, config)
      }
      let printed = null
      try {
        printed = JSON.parse(json.out)
      } catch (e) {
        fail(`${BIN} layouts --json: stdout is no JSON (${e.message}), exit ${json.code}`)
      }
      const got = printed?.layouts
      if (got) {
        const wanted = ['default', ...library.filter((n) => n !== 'cover').sort(), ...[...named.split(', '), 'bad name'].sort()]
        const by = Object.fromEntries(got.map((l) => [l.name, l]))
        const fromLibrary = got.filter((l) => l.source === 'library')
        const names = (list) => list.map((x) => x.name).join(', ')
        const complaints = []
        if (json.code !== 0) complaints.push(`exits with ${json.code}`)
        if (!json.err.includes(HELLO)) complaints.push('what the config printed is not on stderr')
        if (printed.version !== lib.version) complaints.push(`its version is ${printed.version}, not ${lib.version}`)
        if (names(got) !== wanted.join(', ')) complaints.push(`lists ${names(got)}, not ${wanted.join(', ')}`)
        if (by['bad name']?.validName !== false || !by['bad name'].problems.some((p) => /"bad name" is no layout's name/.test(p))) complaints.push('"bad name" is not listed as a file no slide can name, saying so')
        if (got.some((l) => l.name !== 'bad name' && !l.validName)) complaints.push('a layout with a valid name is listed as having none')
        if (by.default?.source !== 'engine' || by.default.file !== null) complaints.push('default is not the engine\'s, with no file')
        for (const l of fromLibrary) {
          if (!l.documented || !l.summary || !l.example.startsWith(`Slide(layout="${l.name}"`)) complaints.push(`the library's ${l.name} has no summary or no example of itself`)
          if (!l.params.length || l.params.some((p) => !p.description || p.token !== `--ar-layout-${l.name}-${p.name}` || !Array.isArray(p.values))) complaints.push(`the library's ${l.name}: its parameters are not each described, with their token and their values`)
        }
        const position = by.overlay?.params.find((p) => p.name === 'position')
        if (position?.values.join(' ') !== 'top-left top top-right left center right bottom-left bottom bottom-right') complaints.push(`overlay's position takes ${JSON.stringify(position?.values)}, not its nine places`)
        const scrim = by.overlay?.params.find((p) => p.name === 'scrim')
        if (JSON.stringify(scrim?.values) !== JSON.stringify(['0..1', 'none'])) complaints.push(`overlay's scrim takes ${JSON.stringify(scrim?.values)}, not 0..1 and none`)
        if (names(by['image-right']?.zones ?? []) !== 'image' || !by['image-right'].zones[0].description) complaints.push(`image-right's zones are ${names(by['image-right']?.zones ?? [])}, not image, described`)
        if ((by.split?.zones ?? []).length) complaints.push(`split's zones are ${names(by.split.zones)}, not none (its sides are its body's children)`)
        const q = by.epigraph
        if (!q?.documented || q.source !== 'project' || q.file !== 'src/layouts/epigraph.css' || q.replaces || !q.summary || !q.example.includes('Slide(layout="epigraph"')) complaints.push('the playground\'s epigraph is not the project\'s src/layouts/epigraph.css, with its summary and example')
        else if (names(q.params) !== 'footer, mark, size' || q.params.some((p) => !p.description)) complaints.push(`epigraph's parameters are ${names(q.params)}, not footer, mark, size, each described`)
        const c = by.cover
        if (c?.source !== 'project' || !c.replaces || c.file !== 'src/layouts/cover.css') complaints.push('cover is not the project\'s src/layouts/cover.css, replacing the library\'s')
        else {
          if (c.summary !== COVER_DOC[0] || c.example !== COVER_DOC[1]) complaints.push(`cover's summary and example are ${JSON.stringify([c.summary, c.example])}, not its doc block's`)
          if (JSON.stringify(c.zones) !== JSON.stringify([{ name: 'aside', description: COVER_DOC[2] }, { name: 'badge', description: '' }])) complaints.push(`cover's zones are ${JSON.stringify(c.zones)}, not aside (described) and badge`)
          if (JSON.stringify(c.params) !== JSON.stringify([{ name: 'pad', token: '--ar-layout-cover-pad', description: COVER_DOC[3], values: [] }, { name: 'tone', token: '--ar-layout-cover-tone', description: COVER_DOC[4], values: ['light', 'dark'] }])) complaints.push(`cover's parameters are ${JSON.stringify(c.params)}, not pad and tone (light or dark), described`)
          if (![/@param nope names no token/, /--ar-layout-cover-title is no attribute/, /the \/\*\* comment at line \d+ is not its doc block/, /^line \d+, color: #c0ffee is a literal colour; /].every((re) => c.problems.some((p) => re.test(p)))) complaints.push(`cover's problems are ${JSON.stringify(c.problems)}: not its @param nope, its title token, its /** comment after its code and its literal colour`)
        }
        if (by.plain?.documented !== false || !by.plain.problems.some((p) => /names no \.layout-plain/.test(p))) complaints.push('plain is not listed with no doc block and its problem (it names no .layout-plain)')
        // the utility classes, from the package's own stylesheet (src/styles/utilities.css, which
        // it must ship): by group, each group with its summary, its example and its classes, each
        // described, no name twice in a group; no flat list beside them
        const groups = printed.classGroups ?? []
        const classes = groups.flatMap((g) => g.classes ?? [])
        const missing = UTILITY_CLASSES.filter((c) => !classes.some((x) => x.name === c))
        if (missing.length) complaints.push(`its classes lack ${missing.join(', ')} (it lists ${classes.map((c) => c.name).join(', ') || 'none'})`)
        if (classes.some((c) => !c.description)) complaints.push('a class is not described')
        if (!groups.length || groups.some((g) => !g.summary || !g.example || !g.classes?.length)) complaints.push('a group of classes has no summary, no example or no class')
        if (groups.some((g) => new Set(g.classes.map((c) => c.name)).size !== g.classes.length)) complaints.push('a group lists a class twice')
        if ('classes' in printed) complaints.push('it has a flat classes list beside classGroups')
        if (classes.some((c) => ['Cols', 'Rows', 'Grid', 'Center'].includes(c.name))) complaints.push('it lists a removed component as a class')
        for (const x of complaints) fail(`${BIN} layouts --json: ${x}`)
        if (!complaints.length) console.log(`  ${BIN} layouts --json: version ${printed.version}; ${names(got)}; each library layout described, the project's epigraph and cover as their doc blocks say (cover replacing the library's, its literal colour a problem; after a licence header; its zones its own; its example with an @ line), plain and "bad name" with their problems; the config's own output on stderr; ${classes.length} utility classes in ${groups.length} groups, each described`)
      }
      // and for a person: a block per layout, saying where it comes from
      log(`${BIN} layouts`)
      const text = await exec('npx', ['--no-install', BIN, 'layouts'], project)
      const lines = [
        'cover (project, src/layouts/cover.css, replaces the library\'s)', `  ${COVER_DOC[0]}`, '    #aside  a note beside the title',
        'epigraph (project, src/layouts/epigraph.css)', 'image-right (library)', '    #image ', 'default (the engine\'s: a Slide without a layout)',
        'plain (project, src/layouts/plain.css)', '  No doc block', '  Problems:', '  Example:',
        'bad name (project, src/layouts/bad name.css, no slide can name it)',
        'Utility classes: ', 'Placement: ', '    cols-2 ', '    highlight ', 'On a Slide: ', '    no-footer ',
      ]
      const absent = lines.filter((l) => !text.out.includes(l))
      if (text.code !== 0 || absent.length) fail(`${BIN} layouts: exit ${text.code}${absent.length ? `; no line with ${absent.map((l) => JSON.stringify(l)).join(', ')}` : ''}`)
      else console.log(`  ${BIN} layouts: a block per layout, where it comes from, its doc, zones, parameters and problems`)
    } finally {
      for (const f of Object.keys(added)) await rm(join(project, 'src', 'layouts', f), { force: true })
    }
    await run(process.execPath, [viteBin, 'build'], project) // the project's own build back in dist/
    if ((typed = await typedLayouts()) !== own.join(', ')) fail(`vite build with the added layouts gone: src/arao-layouts.d.ts lists ${typed ?? 'nothing'}, not ${own.join(', ')}`)
  }

  // a shortcuts file the build turns down (vite/shortcuts.js, checked when Vite starts): a reserved
  // key, a value that is no command, two spellings of one key; each stops vite build naming the file
  {
    const file = join(project, 'src', 'shortcuts.ts')
    const cases = [
      { map: "{ Escape: 'next' }", says: /\[arao\] src\/shortcuts\.ts: "Escape" is reserved/ },
      { map: "{ z: 'nope' }", says: /\[arao\] src\/shortcuts\.ts: "z" → "nope" is no command/ },
      { map: "{ Space: 'next', ' ': 'prev' }", says: /\[arao\] src\/shortcuts\.ts: "Space" and " " are the same key/ },
    ]
    try {
      for (const c of cases) {
        await writeFile(file, `export default ${c.map}\n`)
        const { code, out, err } = await exec(process.execPath, [viteBin, 'build'], project)
        if (code === 0) fail(`vite build with shortcuts ${c.map}: passed`)
        else if (!c.says.test(out + err)) fail(`vite build with shortcuts ${c.map}: nothing matching ${c.says}`)
        else console.log(`  shortcuts ${c.map}: the build stops, naming the file`)
      }
    } finally {
      await writeFile(file, SHORTCUTS)
    }
    await run(process.execPath, [viteBin, 'build'], project)
  }

  browser = await chromium.launch({ executablePath: process.env.ARAO_CHROMIUM || undefined })
  // every page in English (the engine's UI text follows the browser's language, i18n/i18n.ts),
  // whatever the machine's, unless a context asks for another locale (5d)
  const newContext = browser.newContext.bind(browser)
  browser.newContext = (options = {}) => newContext({ locale: 'en-US', ...options })
  browser.newPage = async (options = {}) => {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    page.on('close', () => context.close().catch(() => {}))
    return page
  }

  // starts the dev server or vite preview; resolves to the site's URL (at the base, if the config
  // has one: sub, 'sub/') once it answers
  async function serve(mode, sub = '') {
    const port = await freePort()
    const args = mode === 'dev' ? [] : ['preview']
    server = spawn(process.execPath, [viteBin, ...args, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: project, stdio: ['ignore', 'ignore', 'inherit'] })
    const url = `http://127.0.0.1:${port}/${sub}`
    for (let i = 0; i < 300; i++) {
      if (server.exitCode != null) throw new Error(`vite ${mode} exited with ${server.exitCode}`)
      if (await fetch(url).then((r) => r.ok, () => false)) return url
      await pause(100)
    }
    throw new Error(`vite ${mode} did not answer at ${url}`)
  }

  async function stop() {
    if (!server || server.exitCode != null) return
    const gone = new Promise((r) => server.once('exit', r))
    server.kill()
    await gone
  }

  // opens a deck and walks it to its end; reports what it saw, and keeps its counts in walked
  const walked = {} // deck → { slides, steps }, the last walk's
  async function walk(base, deck, mode, query = '') {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL(encodeURIComponent(deck) + query, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).catch(() => {})
      const slides = await page.locator('.ar-slide').count()
      if (!slides) complaints.push('no .ar-slide in the page')
      // the hash is #/<slide>/<step>; the walk ends when ArrowRight no longer changes it
      const steps = {}
      const hash = () => page.evaluate(() => location.hash)
      const note = (h) => {
        const [, i, s] = h.match(/^#\/(\d+)\/(\d+)/) || []
        if (i) steps[i] = Math.max(steps[i] ?? 0, Number(s))
      }
      // a deck opened without a hash is at its first slide, first step, and writes no hash until it moves
      await pause(300)
      let at = await hash()
      note(/^#\/\d+\/\d+/.test(at) ? at : '#/1/1')
      for (let presses = 0; presses < 2000; presses++) {
        await page.keyboard.press('ArrowRight')
        const next = await page.waitForFunction((was) => location.hash !== was, at, { timeout: 1500, polling: 25 })
          .then(hash, () => null)
        if (!next) break
        note((at = next))
      }
      const per = Object.entries(steps).map(([i, s]) => `${i}:${s}`).join(' ')
      console.log(`  ${mode} /${deck}${query}: ${slides} slides, ended at ${at}; steps per slide ${per}`)
      if (slides && Object.keys(steps).length !== slides)
        complaints.push(`the walk visited ${Object.keys(steps).length} slides of ${slides}`)
      if (!query) walked[deck] = { slides, steps: Object.values(steps).reduce((a, b) => a + b, 0) }
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`${mode} /${deck}${query}: ${c}`)
  }

  // the deck selector: / lists every deck, a card each with its cover drawn in it (the page's URL
  // left as it was), and each link opens its deck; on /?<query> each link keeps the query (not the
  // hash) and the covers are still covers; ?deck=<name> is moved to /<name>; an unknown path or
  // ?deck= shows the list too, with a warning naming it (the only console message expected here).
  // base is the site's URL: / or a sub-path, which every path here is under.
  async function selector(base, mode) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    let expected = null // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().includes(expected)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    // each card's link and title as the list first renders them, before the first paint: a cover
    // is drawn later, once its card is seen and its deck loaded (covers counts any that were)
    await context.addInitScript(() => {
      new MutationObserver((_, watch) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        if (!cards.length) return
        watch.disconnect()
        window.__firstRender = {
          covers: document.querySelectorAll('.ar-thumb').length,
          cards: cards.map((c) => [c.querySelector('a')?.getAttribute('href'), c.querySelector('.ar-decks-title')?.textContent.trim() ?? null]),
        }
      }).observe(document, { childList: true, subtree: true })
    })
    const site = new URL(base).pathname
    const links = page.locator('.ar-decks a.ar-decks-link')
    const listed = async (where, query = '') => {
      await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
      const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const want = decks.map((d) => `${site}${encodeURIComponent(d.toLowerCase())}${query}`).sort()
      if (JSON.stringify([...hrefs].sort()) !== JSON.stringify(want))
        complaints.push(`${where}: the list links to ${hrefs.join(', ') || 'nothing'}, not to ${want.join(', ')}`)
      return hrefs
    }
    // every card has its deck's cover drawn in it; its title, the file name in words (TITLES), is
    // there from the list's first render and stays (no title changes under the reader); the second
    // and the long deck's cards show their cover's heading under it; each path shown is its
    // link's, decoded; every card is as tall as the others, its title, cover heading and path on
    // one line each, the long deck's cut; and the page is where it was
    const card = (href) => decks.find((d) => href?.split('?')[0] === `${site}${encodeURIComponent(d.toLowerCase())}`)
    const named = (cards) => cards.map(([, title]) => JSON.stringify(title)).join(', ')
    const covers = async (where) => {
      const was = await page.evaluate(() => location.href)
      const first = await page.evaluate(() => window.__firstRender ?? null)
      if (!first) complaints.push(`${where}: no card in the list's first render`)
      else {
        if (first.covers) complaints.push(`${where}: ${first.covers} covers drawn in the list's first render: its titles were not read before the covers`)
        if (first.cards.length !== decks.length) complaints.push(`${where}: ${first.cards.length} cards in the list's first render, not ${decks.length}`)
        for (const [href, title] of first.cards) {
          const want = TITLES[card(href)]
          if (want == null) complaints.push(`${where}: no title written down for the card of ${href} (TITLES)`)
          else if (title !== want) complaints.push(`${where}: the card of ${href} is titled ${JSON.stringify(title)} in the list's first render, not ${JSON.stringify(want)} (its file name in words)`)
        }
      }
      const drawn = await page.waitForFunction((n) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        return cards.length === n && cards.every((c) => c.querySelector('.ar-thumb .ar-slide'))
      }, decks.length, { timeout: 30_000 }).then(() => true, () => false)
      if (!drawn) complaints.push(`${where}: not every card has its cover drawn in it (.ar-thumb .ar-slide)`)
      const headings = [MARK, LONG_HEADING]
      const titled = await page.waitForFunction((want) => {
        const shown = [...document.querySelectorAll('.ar-decks-sub')].map((t) => t.textContent.trim())
        return want.every((w) => shown.includes(w))
      }, headings, { timeout: 10_000 }).then(() => true, () => false)
      if (!titled) complaints.push(`${where}: not every cover heading of ${headings.map((h) => `"${h}"`).join(', ')} shows under its card's title (${(await page.locator('.ar-decks-sub').allTextContents()).join(', ')})`)
      const now = await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) => [c.querySelector('a')?.getAttribute('href'), c.querySelector('.ar-decks-title')?.textContent.trim() ?? null]))
      if (first && JSON.stringify(now) !== JSON.stringify(first.cards)) complaints.push(`${where}: the titles changed once the covers were drawn, from ${named(first.cards)} to ${named(now)}`)
      const long = `${site}${encodeURIComponent(basename(LONG[0], '.vue').toLowerCase())}`
      const shape = await page.evaluate((long) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        const tenth = (n) => Math.round(n * 10) / 10
        const heights = cards.map((c) => tenth(c.getBoundingClientRect().height))
        // what each card's content takes, its top to its path's line: the grid stretches the cards
        // of a row to its tallest, so a taller one shows here even with no other row to differ from
        const inner = cards.map((c) => tenth(c.querySelector('.ar-decks-foot').getBoundingClientRect().bottom - c.getBoundingClientRect().top))
        const paths = cards.map((c) => [c.querySelector('.ar-decks-path').textContent.trim(), decodeURIComponent(c.querySelector('a').getAttribute('href').split('?')[0])])
        // the lines a text is laid out on: the distinct tops of its boxes (cut or not, there they all are)
        const lines = (el) => {
          const r = document.createRange()
          r.selectNodeContents(el)
          return new Set([...r.getClientRects()].filter((b) => b.width && b.height).map((b) => Math.round(b.top))).size
        }
        const parts = ['.ar-decks-title', '.ar-decks-sub', '.ar-decks-path']
        const wrapped = cards.flatMap((c) => parts.map((p) => [c.querySelector('a').getAttribute('href'), p, c.querySelector(p)])
          .filter(([, , el]) => el && lines(el) > 1).map(([href, p, el]) => `${p} of ${href} (${lines(el)} lines)`))
        const longCard = cards.find((c) => c.querySelector('a').getAttribute('href').split('?')[0] === long)
        const whole = longCard && parts.filter((p) => {
          const el = longCard.querySelector(p)
          return !el || el.scrollWidth <= el.clientWidth
        })
        return { heights, inner, wrong: paths.filter(([shown, link]) => shown !== link), wrapped, whole }
      }, long)
      // (a pixel apart at most: the grid's columns round their widths, and so their covers' heights)
      if (Math.max(...shape.heights) - Math.min(...shape.heights) > 1) complaints.push(`${where}: the cards are not as tall as each other (${shape.heights.join(', ')} px)`)
      if (Math.max(...shape.inner) - Math.min(...shape.inner) > 1) complaints.push(`${where}: the cards' contents are not as tall as each other (${shape.inner.join(', ')} px): a gap inside the shorter ones of a row`)
      if (shape.wrapped.length) complaints.push(`${where}: text on more than its one line: ${shape.wrapped.join(', ')}`)
      if (!shape.whole) complaints.push(`${where}: no card links to ${long}, the long deck`)
      else if (shape.whole.length) complaints.push(`${where}: the long deck's card shows ${shape.whole.join(', ')} whole, not cut on its one line`)
      for (const [shown, link] of shape.wrong) complaints.push(`${where}: a card shows the path ${shown}, its link goes to ${link}`)
      if (await page.locator('.ar-decks :is(.ar-presenter, .ar-controls, .ar-export)').count()) complaints.push(`${where}: a cover is drawn as something else than a thumbnail`)
      // each cover wears its deck's first theme (COVER_THEMES, else default), on its canvas too
      const worn = await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) => [c.querySelector('a')?.getAttribute('href'),
        c.querySelector('.ar-thumb')?.dataset.theme ?? null, c.querySelector('.ar-thumb .ar-canvas') && getComputedStyle(c.querySelector('.ar-thumb .ar-canvas')).backgroundColor]))
      for (const [href, theme, bg] of worn) {
        const [want, wantBg] = COVER_THEMES[card(href)] ?? ['default', null]
        if (theme !== want || (wantBg && bg !== wantBg)) complaints.push(`${where}: the cover of ${href} wears "${theme}" (background ${bg}), not ${want}${wantBg ? ` (${wantBg})` : ''}`)
      }
      await pause(300)
      const is = await page.evaluate(() => location.href)
      if (is !== was) complaints.push(`${where}: the covers moved the page from ${was} to ${is}`)
      return drawn
    }
    // follows a link of the list; the deck must open at its path and query
    const opens = async (href, how) => {
      await page.waitForURL((u) => u.pathname + u.search === href, { timeout: 30_000 }).catch(() => {})
      const slides = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      const at = await page.evaluate(() => location.pathname + location.search)
      if (at !== href || !slides) complaints.push(`${how} ${href}: landed on ${at}${slides ? '' : ', with no slides'}`)
    }
    try {
      await page.goto(base)
      const hrefs = await listed(site)
      const drawn = await covers(site)
      console.log(`  ${mode} ${site}: ${hrefs.length} decks listed (${hrefs.join(' ')})${drawn ? ', every cover drawn' : ''}`)
      for (const [i, href] of hrefs.entries()) {
        if (i) await page.goto(base)
        await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
        if (i === 0) {
          // the keyboard alone: Tab reaches the first link, Enter follows it
          await page.keyboard.press('Tab')
          const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'))
          if (focused !== href) complaints.push(`Tab focuses ${focused ?? 'nothing'}, not the first link (${href})`)
          await page.keyboard.press('Enter')
          await opens(href, 'Enter on')
        } else {
          await page.locator(`.ar-decks a[href="${href}"]`).click()
          await opens(href, 'a click on')
        }
      }
      // the links keep the query, not the hash; the covers stay covers
      const query = `theme=${THEME}&presenter`
      await page.goto(new URL(`?${query}#/2/1`, base).href)
      await listed(`${site}?${query}#/2/1`, `?${query}`)
      await covers(`${site}?${query}#/2/1`)
      // the old form: moved to the path, with the rest of the query and the hash (and the name as
      // the list writes it)
      const old = `?deck=${second.toUpperCase()}&theme=${THEME}#/2/1`
      await page.goto(new URL(old, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).catch(() => {})
      await pause(300)
      const moved = await page.evaluate(() => location.pathname + location.search + location.hash)
      const meant = `${site}${second}?theme=${THEME}#/2/1`
      if (moved !== meant) complaints.push(`${site}${old}: at ${moved}, not ${meant}`)
      const heading = await page.locator('.ar-slide:visible h2').first().textContent({ timeout: 5_000 }).catch(() => '')
      if (!heading.includes('Picked from the list')) complaints.push(`${site}${old}: not on the second deck's slide 2 (${heading || 'no heading'})`)
      // a name that is no deck, as a path and in the old form: the list, with a notice and a warning
      for (const [path, name] of [['no-such-deck', 'no-such-deck'], ['?deck=nor-this-one', 'nor-this-one']]) {
        expected = `"${name}"`
        await page.goto(new URL(path, base).href)
        await listed(`${site}${path}`)
        const notice = (await page.locator('.ar-decks [role="alert"]').textContent({ timeout: 5_000 }).catch(() => null)) ?? ''
        if (!notice.includes(name)) complaints.push(`${site}${path}: no notice naming it above the list`)
        const at = await page.evaluate(() => location.pathname)
        if (at !== site + name) complaints.push(`${site}${path}: at ${at}, not ${site + name}`)
        await pause(300)
        if (expected) complaints.push(`${site}${path}: no console warning naming it`)
        expected = null
      }
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`${mode} selector: ${c}`)
  }

  // useDeck()'s face, on the second deck (window.__faces): every write through it is refused
  // (Vue's own warnings about them are expected; any other warning, error or page error fails),
  // setTheme of a name the deck has not gives one [arao] warning and changes nothing, and the
  // preview's functions do nothing (no move, no theme, no fullscreen, no window)
  async function face(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    const arao = []
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (m.type() === 'warning' && m.text().startsWith('[arao]')) arao.push(m.text())
      else if (!/failed: (target|computed value) is readonly/.test(m.text())) complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    context.on('page', () => complaints.push('the preview opened a window'))
    const open = async (query) => {
      await page.goto(new URL(`${second}${query}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
    }
    try {
      await open('')
      const audience = await page.evaluate(() => {
        const d = window.__faces[0]
        const read = () => JSON.stringify([d.theme.value, d.themes.value, d.timer.value, d.duration.value])
        const was = read()
        const writes = [() => (d.go = null), () => d.themes.value.push('x'), () => (d.timer.value.state = 'x'), () => (d.theme.value = 'x'), () => (d.duration.value = 1)]
        for (const write of writes) try { write() } catch {}
        d.setTheme('no-such-theme')
        return { frozen: Object.isFrozen(d), go: typeof d.go, same: was === read() }
      })
      if (!audience.frozen || audience.go !== 'function') complaints.push('the face is not frozen')
      if (!audience.same) complaints.push('a write through the face changed the deck')
      if (arao.length !== 1 || !arao[0].includes('no-such-theme')) complaints.push(`setTheme of an unknown name: ${arao.length} [arao] warnings, not 1`)
      await open('?presenter')
      const preview = await page.evaluate(() => {
        const d = window.__faces.find((f) => f.role === 'preview')
        const was = location.href + d.theme.value
        d.go(1), d.next(), d.setTheme(d.themes.value[1]), d.toggleFullscreen(), d.openPresenter()
        return { frozen: Object.isFrozen(d), same: was === location.href + d.theme.value && !document.fullscreenElement }
      })
      await pause(300)
      if (!preview.frozen) complaints.push(`the preview's face is not frozen`)
      if (!preview.same) complaints.push(`a function of the preview's face acted`)
      console.log(`  dev useDeck() face: ${complaints.length ? 'problems below' : 'frozen, read-only, inert in the preview'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev useDeck() face: ${c}`)
  }

  // Background and steps, on the playground's slide "A background": its picture shows from step 1,
  // its tint (Background.tint(v-step="2")) from step 2, its wash (inside a div(v-step="3")) from
  // step 3, in the slide's background layer, stacked in that order; the slide counts the three
  // steps; no warning (a directive on a component whose root is no element warns)
  async function backgrounds(base) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL('playground#/1/1', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      const n = await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].findIndex((s) => s.querySelector('h2')?.textContent.trim() === 'A background') + 1)
      if (!n) complaints.push('no slide "A background" in the playground')
      else {
        const layers = async (step) => {
          await page.goto(new URL(`playground#/${n}/${step}`, base).href)
          await page.waitForFunction((h) => location.hash === h, `#/${n}/${step}`, { timeout: 5_000 }).catch(() => {})
          await pause(300)
          // slide n itself (the one before it may still be fading out), its layers bottom to top:
          // by their stacking order (z-index; they mount in no set order in the layer)
          return page.evaluate((i) => {
            const slide = document.querySelectorAll('.ar-slide')[i]
            const layers = [...(slide?.querySelectorAll('.ar-slide-bg > .ar-background') ?? [])]
              .sort((a, b) => Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex))
            return {
              hash: location.hash,
              layers: layers.map((b) => `${b.querySelector('img') ? 'picture' : b.classList.contains('tint') ? 'tint' : b.classList.contains('wash') ? 'wash' : '?'}${b.classList.contains('ar-step-hidden') ? ':hidden' : ''}`).join(' '),
            }
          }, n - 1)
        }
        // each step: the layers in order, hidden ones marked; reaching #/n/3 also says the slide
        // has three steps (a hash past its last step is clamped to it)
        const want = { 1: 'picture tint:hidden wash:hidden', 2: 'picture tint wash:hidden', 3: 'picture tint wash' }
        for (const [step, expected] of Object.entries(want)) {
          const got = await layers(step)
          if (got.hash !== `#/${n}/${step}`) complaints.push(`#/${n}/${step} opened ${got.hash}: the slide does not count step ${step}`)
          else if (got.layers !== expected) complaints.push(`step ${step}: background layers "${got.layers}", not "${expected}"`)
        }
      }
      console.log(`  dev Background steps: ${complaints.length ? 'problems below' : 'on it and around it, in the background layer, three steps counted'}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`dev Background steps: ${c}`)
  }

  // a layout's parameters, set as attributes: on the second deck's cover, bar (a ref, BAR[0]) is
  // --ar-layout-cover-bar in the section's style, which the .bar is painted with, in the audience
  // view, the presenter view (its slide and its preview's copy), export mode and the list's thumbnail;
  // not an attribute of the section, where data-smoke (no parameter) is. The ref changed
  // (BAR[1]): the bar follows. On the playground's deck: the library's image-right takes
  // columns="3fr 2fr" (its columns, 3 to 2), the project's epigraph size="48px" (its blockquote's size).
  async function layoutParams(base, mode) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const token = '--ar-layout-cover-bar'
    // every cover of the second deck in the page (in the list, its card's), as found
    const covers = (where) => page.evaluate(({ where, token }) => {
      const scope = where === 'list' ? [...document.querySelectorAll('.ar-decks-card')].find((c) => /\/second$/i.test(c.querySelector('a')?.getAttribute('href') ?? '')) : document
      return [...(scope?.querySelectorAll('.ar-slide.layout-cover') ?? [])].map((s) => ({
        token: s.style.getPropertyValue(token).trim(),
        attr: s.hasAttribute('bar'),
        smoke: s.getAttribute('data-smoke'),
        bar: s.querySelector('.bar') && getComputedStyle(s.querySelector('.bar')).backgroundColor,
      }))
    }, { where, token })
    const check = async (what, where, color) => {
      const found = await covers(where)
      if (!found.length) return complaints.push(`${what}: no cover of the second deck`)
      for (const c of found) {
        if (c.token !== color) complaints.push(`${what}: the cover's ${token} is "${c.token}", not ${color}`)
        else if (c.bar && c.bar !== color) complaints.push(`${what}: the cover's .bar is ${c.bar}, not ${color}`)
        if (c.attr) complaints.push(`${what}: bar is an attribute of the cover's section too`)
        if (c.smoke !== 'kept') complaints.push(`${what}: data-smoke="kept" did not reach the cover's section (${c.smoke})`)
      }
    }
    const open = async (path) => {
      await page.goto(new URL(path, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(500)
    }
    try {
      await open(`${second}#/1/1`)
      await check('audience', 'page', BAR[0])
      await page.evaluate((c) => { window.__bar.value = c }, BAR[1])
      await pause(300)
      await check('audience, the ref changed', 'page', BAR[1])
      await open(`${second}?presenter#/1/1`)
      await check('presenter view', 'page', BAR[0])
      await open(`${second}?export`)
      await check('export mode', 'page', BAR[0])
      await page.goto(base)
      await page.waitForFunction(() => document.querySelector('.ar-decks-card .ar-thumb .ar-slide'), null, { timeout: 30_000 }).catch(() => {})
      await page.waitForFunction(() => [...document.querySelectorAll('.ar-decks-card')].every((c) => c.querySelector('.ar-thumb .ar-slide')), null, { timeout: 30_000 }).catch(() => {})
      await check('the list\'s thumbnail', 'list', BAR[0])
      // the playground's: the library's image-right (its columns, once on screen) and the
      // project's epigraph (its blockquote's size)
      await open('playground#/1/1')
      const n = await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].findIndex((s) => s.classList.contains('layout-image-right')) + 1)
      if (!n) complaints.push('no image-right slide in the playground')
      else {
        await open(`playground#/${n}/1`)
        const got = await page.evaluate((i) => {
          const s = document.querySelectorAll('.ar-slide')[i]
          const q = document.querySelector('.ar-slide.layout-epigraph')
          return {
            token: s.style.getPropertyValue('--ar-layout-image-right-columns').trim(),
            columns: getComputedStyle(s).gridTemplateColumns.split(' ').map(parseFloat),
            attr: s.hasAttribute('columns'),
            epigraph: q?.style.getPropertyValue('--ar-layout-epigraph-size').trim(),
            size: q && getComputedStyle(q.querySelector('blockquote')).fontSize,
          }
        }, n - 1)
        const ratio = got.columns.length === 2 ? got.columns[0] / got.columns[1] : NaN
        if (got.token !== '3fr 2fr' || got.attr) complaints.push(`playground image-right: --ar-layout-image-right-columns "${got.token}"${got.attr ? ', and columns an attribute too' : ''}`)
        else if (Math.abs(ratio - 1.5) > 0.01) complaints.push(`playground image-right: its columns ${got.columns.join(' / ')}, not 3 to 2`)
        if (got.epigraph !== '48px' || got.size !== '48px') complaints.push(`playground epigraph: --ar-layout-epigraph-size "${got.epigraph}", its blockquote ${got.size}, not 48px`)
      }
      console.log(`  ${mode} layout parameters: ${complaints.length ? 'problems below' : 'set as tokens in audience, presenter, export and thumbnail, following a ref; the library\'s and the project\'s'}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`${mode} layout parameters: ${c}`)
  }

  // The slides of the deck, on the playground's. A slide of the project's own (WrappedSlide,
  // src/slides/WrappedSlide.vue: a component that renders a Slide, the deck's content passed on
  // through its slot) is a slide like the others: in its place (right after "A table", right
  // before "Icons"), its heading the title of its header and its name in the jump list, at its
  // number; its two steps walked (#/n/1, #/n/2, then the next slide); a page per step in the
  // export's book. And Agenda (on the playground's two slides of the default layout that hold
  // one) lists the titles of the deck's section slides, in order, each item marked as seen from
  // its slide (done, current with aria-current, upcoming), in the audience view, the presenter
  // view (its slide and the preview's copy) and the export's book; and wears its own look there,
  // with no layout for it (big rows, numbered, the current one bold), as does a hand-written
  // ol.agenda (the sixth deck's).
  async function deckSlides(base, mode) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const TITLE = 'A slide in a component'
    const SECTIONS = ['Layouts', 'Building blocks', 'The end']
    const STATES = ['current upcoming upcoming', 'done current upcoming']
    const open = async (path, ms = 500) => {
      await page.goto(new URL(path, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(ms)
    }
    // every Agenda in a part of the page (the stages, one by one, or the export's book): each
    // item's text, its state (the state classes it has), and its aria-current
    const agendas = (scope) => page.evaluate((scope) => [...document.querySelectorAll(scope)].map((root) =>
      [...root.querySelectorAll('.ar-agenda')].map((ol) => [...ol.children].map((li) => ({
        text: li.textContent.trim(),
        state: ['done', 'current', 'upcoming'].filter((s) => li.classList.contains(`ar-agenda-${s}`)).join(' '),
        item: li.classList.contains('ar-agenda-item'),
        aria: li.getAttribute('aria-current'),
      })))), scope)
    const checkAgendas = (what, found) => {
      if (found.length !== STATES.length) return complaints.push(`${what}: ${found.length} Agendas, not ${STATES.length}`)
      found.forEach((items, k) => {
        const texts = items.map((i) => i.text).join(', ')
        const states = items.map((i) => i.state).join(' ')
        if (texts !== SECTIONS.join(', ')) complaints.push(`${what}: Agenda ${k + 1} lists ${texts}, not ${SECTIONS.join(', ')}`)
        else if (states !== STATES[k]) complaints.push(`${what}: Agenda ${k + 1}'s states are ${states}, not ${STATES[k]}`)
        else if (items.some((i) => !i.item || (i.aria === 'step') !== (i.state === 'current'))) complaints.push(`${what}: Agenda ${k + 1}'s items are not each .ar-agenda-item, aria-current="step" on the current one alone`)
      })
    }
    // the look of every agenda in a part of the page (an Agenda, an ol.agenda), its own CSS
    // (Agenda.vue) whatever the layout: what it lacks of it, '' for one that has it all (rows at
    // 0.65x --ar-title, no list marker, a two-digit number before each item, the current one bold)
    const looks = (scope) => page.evaluate((scope) => [...document.querySelectorAll(scope)]
      .flatMap((root) => [...root.querySelectorAll('ol.ar-agenda, ol.agenda')]).map((ol) => {
        const cs = getComputedStyle(ol)
        const size = parseFloat(cs.fontSize) / parseFloat(cs.getPropertyValue('--ar-title'))
        const number = ol.firstElementChild ? getComputedStyle(ol.firstElementChild, '::before').content : 'none'
        const current = ol.querySelector(':scope > .ar-agenda-current')
        return [
          Math.abs(size - 0.65) > 0.01 && `its rows at ${size.toFixed(2)}x --ar-title`,
          cs.listStyleType !== 'none' && `a ${cs.listStyleType} marker`,
          !number.includes('counter(ar-agenda, decimal-leading-zero)') && `its numbers ${number}`,
          current && Number(getComputedStyle(current).fontWeight) < 700 && 'its current item not bold',
        ].filter(Boolean).join(', ')
      }), scope)
    const checkLooks = (what, found, count) => {
      if (found.length !== count) complaints.push(`${what}: ${found.length} agendas drawn, not ${count}`)
      found.forEach((lacks, k) => lacks && complaints.push(`${what}: agenda ${k + 1} has not its own look: ${lacks}`))
    }
    try {
      await open('playground#/1/1')
      const got = await page.evaluate((title) => {
        const slides = [...document.querySelector('.ar-stage').querySelectorAll('.ar-slide')]
        const at = slides.findIndex((s) => s.querySelector(':scope > .ar-header > .ar-title')?.textContent.trim() === title)
        const heading = (s) => s?.querySelector('h1, h2')?.textContent.trim() ?? null
        return { at, total: slides.length, before: heading(slides[at - 1]), after: heading(slides[at + 1]) }
      }, TITLE)
      const n = got.at + 1
      if (got.at < 0) complaints.push(`no slide whose header's title is "${TITLE}" (WrappedSlide's content)`)
      else if (got.before !== 'A table' || got.after !== 'Icons') complaints.push(`"${TITLE}" is slide ${n}, between "${got.before}" and "${got.after}", not between "A table" and "Icons"`)
      else {
        // its name in the jump list, at its number
        await page.keyboard.press('g')
        await page.waitForSelector('.ar-slides .ar-item', { timeout: 5_000 }).catch(() => {})
        const listed = await page.evaluate(() => [...document.querySelectorAll('.ar-slides .ar-item')].map((b) => [b.querySelector('.n')?.textContent.trim(), b.querySelector('.t')?.textContent.trim()]))
        await page.keyboard.press('Escape')
        const entry = listed.find(([, t]) => t === TITLE)
        if (!entry || entry[0] !== String(n)) complaints.push(`the jump list has "${TITLE}" at ${entry ? entry[0] : 'no number'}, not ${n}`)
        // its steps, walked
        await open(`playground#/${n}/1`, 300)
        const hashes = [await page.evaluate(() => location.hash)]
        for (let k = 0; k < 2; k++) {
          const was = hashes[hashes.length - 1]
          await page.keyboard.press('ArrowRight')
          await page.waitForFunction((w) => location.hash !== w, was, { timeout: 3_000 }).catch(() => {})
          hashes.push(await page.evaluate(() => location.hash))
        }
        const walkedTo = [`#/${n}/1`, `#/${n}/2`, `#/${n + 1}/1`]
        if (hashes.join(' ') !== walkedTo.join(' ')) complaints.push(`"${TITLE}" walked ${hashes.join(' → ')}, not ${walkedTo.join(' → ')}`)
      }
      checkAgendas('audience', (await agendas('.ar-viewport > .ar-stage'))[0] ?? [])
      checkLooks('audience', await looks('.ar-viewport > .ar-stage'), STATES.length)
      await open('playground?presenter#/1/1')
      const drawings = await agendas('.ar-stage')
      if (drawings.length !== 2) complaints.push(`the presenter view draws ${drawings.length} stages, not 2`)
      drawings.forEach((found, k) => checkAgendas(`presenter view, ${k ? 'its preview' : 'its slide'}`, found))
      checkLooks('presenter view (both copies)', await looks('.ar-stage'), 2 * STATES.length)
      // the export's book, once done: two pages for its two steps, and the Agendas as on screen
      await open('playground?export', 300)
      await page.waitForSelector('.ar-export-done', { timeout: 90_000 }).catch(() => complaints.push('export mode: the book was not done within 90 s'))
      const pages = await page.evaluate((title) => [...document.querySelectorAll('.ar-book .ar-page')].filter((p) => p.querySelector('.ar-header > .ar-title')?.textContent.trim() === title).length, TITLE)
      if (pages !== 2) complaints.push(`export mode: ${pages} pages of "${TITLE}", not 2 (one per step)`)
      const book = await agendas('.ar-book')
      // each slide with an Agenda is on one page (one step): the book's Agendas are its two, in order
      checkAgendas('export mode', book[0] ?? [])
      checkLooks('export mode', await looks('.ar-book'), STATES.length)
      // the sixth deck's Agenda, on its first slide: in its window (with the ol.agenda of its
      // second and the Agendas of its three sections, five agendas with their look), and in its
      // thumbnail in the list (where its sections draw their titles alone, and its second slide
      // nothing). The items of the first Agenda in a part of the page
      const items = (scope) => page.evaluate((scope) => [...(document.querySelector(scope)?.querySelector('.ar-agenda')?.children ?? [])]
        .map((li) => `${li.textContent.trim()}:${['done', 'current', 'upcoming'].filter((s) => li.classList.contains(`ar-agenda-${s}`)).join(' ')}`).join(', '), scope)
      const outline = basename(OUTLINE[0], '.vue').toLowerCase()
      await open(`${outline}#/1/1`)
      let listed = await items('.ar-viewport > .ar-stage')
      if (listed !== OUTLINE_ITEMS) complaints.push(`/${outline}: its Agenda on its first slide lists ${listed || 'nothing'}, not ${OUTLINE_ITEMS}`)
      checkLooks(`/${outline}`, await looks('.ar-viewport > .ar-stage'), 5)
      await page.goto(base)
      const card = `.ar-decks-card:has(a[href$="/${outline}"]) .ar-thumb`
      await page.waitForFunction((card) => document.querySelector(`${card} .ar-agenda li`), card, { timeout: 30_000 }).catch(() => {})
      listed = await items(card)
      if (listed !== OUTLINE_ITEMS) complaints.push(`the list: /${outline}'s thumbnail shows an Agenda of ${listed || 'nothing'}, not ${OUTLINE_ITEMS}`)
      checkLooks(`the list: /${outline}'s thumbnail`, await looks(card), 1)
      console.log(`  ${mode} slides of the deck: ${complaints.length ? 'problems below' : `"${TITLE}" (a component wrapping Slide) is slide ${n}, titled, in the jump list, two steps, two pages; Agenda's sections, states and look in audience, presenter (both copies) and export, and on a first slide, in its window and its thumbnail; an ol.agenda's look`}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`${mode} slides of the deck: ${c}`)
  }

  // the utility classes (src/styles/utilities.css, in the package's arao.css), on the playground's
  // slide "Utility classes" at its last step (header, 4d)
  async function utilities(base, mode) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL('playground#/1/1', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      const n = await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].findIndex((s) => s.querySelector('.ar-title')?.textContent.trim() === 'Utility classes') + 1)
      if (!n) complaints.push('no slide "Utility classes" in the playground')
      else {
        await page.goto(new URL(`playground#/${n}/2`, base).href)
        await page.waitForFunction((h) => location.hash === h, `#/${n}/2`, { timeout: 5_000 }).catch(() => {})
        await pause(500)
        const got = await page.evaluate((i) => {
          const s = document.querySelectorAll('.ar-slide')[i]
          const style = (sel) => { const e = s.querySelector(sel); return e ? getComputedStyle(e) : null }
          // a token as a colour, resolved where the slide is
          const resolve = (token) => {
            const probe = document.createElement('span')
            probe.style.color = `var(${token})`
            s.append(probe)
            const color = getComputedStyle(probe).color
            probe.remove()
            return color
          }
          const cols = style('.cols')
          const tracks = cols?.gridTemplateColumns.split(' ').map(parseFloat) ?? []
          const text = parseFloat(getComputedStyle(s).fontSize)
          const row = style('.row')
          const stack = style('.stack.gap-sm')
          const child = s.querySelector('.cols > *')
          return {
            cols: cols ? `${cols.display} ${cols.alignItems} ${cols.flexGrow}` : null,
            ratio: tracks.length === 2 ? tracks[0] / tracks[1] : NaN,
            inherited: child ? getComputedStyle(child).getPropertyValue('--ar-cols').trim() : null,
            row: row ? `${row.display} ${row.flexDirection} ${row.alignItems}` : null,
            stack: stack ? `${stack.display} ${stack.flexDirection} ${stack.rowGap}` : null,
            small: getComputedStyle(s).getPropertyValue('--ar-gap-sm').trim(),
            lg: parseFloat(style('.text-lg')?.fontSize) / text,
            sm: parseFloat(style('p.text-sm')?.fontSize) / text,
            accent: style('span.accent')?.color === resolve('--ar-accent'),
            highlight: style('.highlight')?.backgroundColor,
          }
        }, n - 1)
        if (got.cols !== 'grid center 1') complaints.push(`.cols.grow.middle is "${got.cols}" (display, align-items, flex-grow), not "grid center 1"`)
        if (Math.abs(got.ratio - 1.5) > 0.01) complaints.push(`.cols with --ar-cols: 3fr 2fr has columns of ${got.ratio.toFixed(2)} to 1, not 3 to 2`)
        if (got.inherited) complaints.push(`a child of .cols inherits --ar-cols (${got.inherited})`)
        if (got.row !== 'flex row center') complaints.push(`.row is "${got.row}", not "flex row center"`)
        if (got.stack !== `flex column ${got.small}`) complaints.push(`.stack.gap-sm is "${got.stack}", not "flex column ${got.small}"`)
        if (Math.abs(got.lg - 1.25) > 0.01 || Math.abs(got.sm - 0.75) > 0.01) complaints.push(`.text-lg and .text-sm are ${got.lg} and ${got.sm} times the text, not 1.25 and .75`)
        if (!got.accent) complaints.push('.accent is not the accent')
        if (!got.highlight || /rgba\(0, 0, 0, 0\)|transparent/.test(got.highlight)) complaints.push(`.highlight has no background (${got.highlight})`)
      }
      console.log(`  ${mode} utility classes: ${complaints.length ? 'problems below' : 'columns of 3 to 2 not inherited, middle, grow, row, stack and its gap, text sizes, accent and highlight'}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`${mode} utility classes: ${c}`)
  }

  // an Agenda on a section slide (header, 4g), whose background is the accent the Agenda draws in
  // elsewhere: on the outline's second section (done, current, upcoming), in every built-in theme,
  // each item's text and its number keep SECTION_CONTRAST against the background beside them.
  // Measured on the pixels of a screenshot (the section's background may be a gradient the theme
  // draws over the accent): a glyph's colour is the pixel of its box farthest from the background,
  // the background the middle one of a strip beside the text, on both sides (the gap after the
  // number, past the text's end), the lower of the two counting
  async function sectionAgendas(base, mode, themes) {
    const complaints = []
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const outline = basename(OUTLINE[0], '.vue').toLowerCase()
    const worst = {}
    try {
      for (const theme of themes) {
        await page.goto(new URL(`${outline}?theme=${theme}#/${OUTLINE_SECTION}/1`, base).href)
        await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
        await page.waitForFunction(() => !document.querySelector('[data-ar-busy]') && document.fonts.status === 'loaded', null, { timeout: 15_000 }).catch(() => {})
        await pause(1200) // the slide's fade
        // each item of the Agenda on the slide on screen: its state, and the boxes of its text,
        // its number and the background beside the text (screen px)
        const boxes = await page.evaluate(() => {
          const slide = [...document.querySelectorAll('.ar-viewport .ar-slide')].find((s) => getComputedStyle(s).display !== 'none')
          return [...(slide?.querySelectorAll('.ar-agenda > li') ?? [])].map((li) => {
            const range = document.createRange()
            range.selectNodeContents(li)
            const t = range.getBoundingClientRect()
            const l = li.getBoundingClientRect()
            const gap = parseFloat(getComputedStyle(li).columnGap)
            return {
              state: ['done', 'current', 'upcoming'].filter((s) => li.classList.contains(`ar-agenda-${s}`)).join(' '),
              text: [t.left, t.top, t.width, t.height],
              number: [l.left, t.top, t.left - gap - l.left, t.height],
              backs: [[t.left - gap + 4, t.top, gap - 8, t.height], [t.right + 8, t.top, 24, t.height]],
            }
          })
        })
        const states = boxes.map((b) => b.state).join(' ')
        if (states !== 'done current upcoming') {
          complaints.push(`${theme}: the Agenda on /${outline}'s slide ${OUTLINE_SECTION} has the states ${states || 'none'}, not done current upcoming`)
          continue
        }
        const png = await page.screenshot()
        const got = await page.evaluate(async ({ b64, boxes }) => {
          const img = new Image()
          img.src = `data:image/png;base64,${b64}`
          await img.decode()
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          // read back many times: a context kept for it (else Chrome warns, a console warning
          // that fails the smoke test)
          const g = canvas.getContext('2d', { willReadFrequently: true })
          g.drawImage(img, 0, 0)
          const pixels = ([x, y, w, h]) => {
            const d = g.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data
            const out = []
            for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]])
            return out
          }
          const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          const lum = ([r, gr, b]) => 0.2126 * lin(r) + 0.7152 * lin(gr) + 0.0722 * lin(b)
          const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
          const middle = (px) => px.sort((a, b) => lum(a) - lum(b))[px.length >> 1]
          const glyph = (box, backs) => Math.min(...backs.map((back) => Math.max(...pixels(box).map((p) => ratio(p, back)))))
          return boxes.map(({ state, text, number, backs }) => {
            const bs = backs.map((b) => middle(pixels(b)))
            return { state, text: glyph(text, bs), number: glyph(number, bs) }
          })
        }, { b64: png.toString('base64'), boxes })
        for (const { state, text, number } of got) {
          for (const [part, r] of [['text', text], ['number', number]]) {
            if (!(r >= SECTION_CONTRAST)) complaints.push(`${theme}: an Agenda on a section, its ${state} item's ${part} at ${r.toFixed(2)}:1, not ${SECTION_CONTRAST}:1`)
            worst[state] = Math.min(worst[state] ?? Infinity, r)
          }
        }
      }
    } finally {
      await page.context().close()
    }
    const lowest = Object.entries(worst).map(([s, r]) => `${s} ${r.toFixed(1)}`).join(', ')
    console.log(`  ${mode} an Agenda on a section: ${complaints.length ? 'problems below' : `done, current and upcoming, text and numbers, ${SECTION_CONTRAST}:1 at least in ${themes.join(', ')} (lowest: ${lowest})`}`)
    for (const c of complaints) fail(`${mode} an Agenda on a section: ${c}`)
  }

  // crowded slides that fit (header, 4f), on the dense deck, in every built-in theme: each slide
  // stayed on long enough for the engine to measure it (in dev it would warn, "[arao] overflow",
  // and nothing may warn), and measured here too, on its own terms: the text of its body (each
  // h3, p and li, each icon) inside the slide's padding, the safe area. The grids of 11, 12 and 13
  // blocks fit as they are; Slide.fit's list does not at its body's size (seen with the class
  // taken off for a moment) and fits fitted (--_ar-fit on its body, from .6 to 1); Slide.scale-80's
  // body is .8 of the slide's text. The Slide.fit of an Agenda of ten sections and the Slide.fit of
  // grid whose pictures are DENSE_ICON px do not fit whole either, and fit fitted, everything in
  // them shrunk by the same factor: the Agenda's rows (sized from the title's tokens) and the
  // pictures (given in px) are --_ar-fit of their whole size. Fitted, a grid's text goes as far
  // as fit lets it, the safe area grown by the body's negative margin (core/overflow.ts): that
  // one is measured against it
  async function fits(base, mode, themes) {
    const complaints = []
    for (const theme of themes) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${theme}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${theme}: page error: ${e.message}`))
      try {
        await page.goto(new URL(`dense?theme=${theme}#/1/1`, base).href)
        await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
        const titles = await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].map((s) => s.querySelector('.ar-title')?.textContent.trim()))
        const fittedTitles = [DENSE_SLIDES.fit, DENSE_SLIDES.agenda, DENSE_SLIDES.icons]
        for (const title of [...DENSE_SLIDES.grids, DENSE_SLIDES.fit, DENSE_SLIDES.scaled, DENSE_SLIDES.agenda, DENSE_SLIDES.icons]) {
          const n = titles.indexOf(title) + 1
          if (!n) {
            complaints.push(`${theme}: no slide "${title}"`)
            continue
          }
          await page.evaluate((h) => { location.hash = h }, `#/${n}/1`)
          await page.waitForFunction((h) => location.hash === h, `#/${n}/1`, { timeout: 5_000 }).catch(() => {})
          await page.waitForFunction(() => !document.querySelector('[data-ar-busy]') && document.fonts.status === 'loaded', null, { timeout: 15_000 }).catch(() => {})
          await pause(1200) // the slide's fade, then the engine's own measure, a moment after
          const got = await page.evaluate(([i, room]) => {
            const s = document.querySelectorAll('.ar-slide')[i]
            const body = s.querySelector(':scope > .ar-body')
            const k = s.getBoundingClientRect().width / s.offsetWidth
            const sr = s.getBoundingClientRect()
            const cs = getComputedStyle(s)
            // the safe area; with room, grown by as much as a negative margin pulls the body out (a
            // grid's: what fit measures against, core/overflow.ts, and fills up to it)
            const bcs = getComputedStyle(body)
            const pull = (side) => (room ? Math.max(0, -parseFloat(bcs[`margin${side}`])) * k : 0)
            const area = {
              t: sr.top + parseFloat(cs.paddingTop) * k - pull('Top'), r: sr.right - parseFloat(cs.paddingRight) * k + pull('Right'),
              b: sr.bottom - parseFloat(cs.paddingBottom) * k + pull('Bottom'), l: sr.left + parseFloat(cs.paddingLeft) * k - pull('Left'),
            }
            // how far the body's text reaches past the safe area, canvas px (0: inside)
            const out = () => Math.max(0, ...[...body.querySelectorAll('h3, p, li, .ar-icon')].map((e) => {
              const r = e.getBoundingClientRect()
              return Math.max(r.bottom - area.b, r.right - area.r, area.l - r.left, area.t - r.top) / k
            }))
            // the size of the Agenda's rows, and the height of the first picture (canvas px)
            const sizes = () => ({
              agenda: parseFloat(getComputedStyle(body.querySelector('.ar-agenda') ?? body).fontSize),
              icon: (body.querySelector('.ar-icon')?.getBoundingClientRect().height ?? 0) / k,
            })
            const fitted = s.classList.contains('fit')
            let unfitted = null
            let whole = null
            if (fitted) {
              s.classList.remove('fit')
              unfitted = out()
              whole = sizes()
              s.classList.add('fit')
            }
            return {
              out: out(),
              unfitted,
              whole,
              sizes: sizes(),
              fit: parseFloat(body.style.getPropertyValue('--_ar-fit')) || 1,
              scale: parseFloat(getComputedStyle(body).fontSize) / parseFloat(getComputedStyle(s).fontSize),
            }
          }, [n - 1, title === DENSE_SLIDES.icons])
          if (got.out > 2) complaints.push(`${theme}: "${title}" reaches ${got.out.toFixed(1)}px past the slide's padding${title === DENSE_SLIDES.icons ? ', and the body\'s margin' : ''}`)
          if (fittedTitles.includes(title)) {
            if (!(got.unfitted > 2)) complaints.push(`${theme}: "${title}" fits without Slide.fit (${got.unfitted?.toFixed(1)}px past): it tests nothing`)
            if (!(got.fit >= 0.6 && got.fit < 1)) complaints.push(`${theme}: "${title}" has --_ar-fit ${got.fit}, not from .6 to 1`)
          } else if (got.fit !== 1) complaints.push(`${theme}: "${title}", no .fit, has --_ar-fit ${got.fit}`)
          if (title === DENSE_SLIDES.scaled && Math.abs(got.scale - 0.8) > 0.005) complaints.push(`${theme}: "${title}"'s body is ${got.scale.toFixed(3)} of the slide's text, not .8`)
          if (title === DENSE_SLIDES.agenda && got.whole && Math.abs(got.sizes.agenda / got.whole.agenda - got.fit) > 0.005)
            complaints.push(`${theme}: "${title}"'s Agenda is ${(got.sizes.agenda / got.whole.agenda).toFixed(3)} of its size, not --_ar-fit (${got.fit})`)
          if (title === DENSE_SLIDES.icons && got.whole) {
            if (Math.abs(got.whole.icon - DENSE_ICON) > 1) complaints.push(`${theme}: "${title}"'s pictures are ${got.whole.icon.toFixed(1)}px whole, not icon-size, ${DENSE_ICON}px`)
            if (Math.abs(got.sizes.icon - DENSE_ICON * got.fit) > 1) complaints.push(`${theme}: "${title}"'s pictures are ${got.sizes.icon.toFixed(1)}px fitted, not ${DENSE_ICON}px x --_ar-fit (${got.fit})`)
          }
        }
      } finally {
        await page.context().close()
      }
    }
    console.log(`  ${mode} crowded slides: ${complaints.length ? 'problems below' : `grids of 11, 12 and 13 blocks, Slide.fit, Slide.scale-80, an Agenda of ten sections and pictures of ${DENSE_ICON}px on Slide.fit fit in ${themes.join(', ')}`}`)
    for (const c of complaints) fail(`${mode} crowded slides: ${c}`)
  }

  // the overlay layout's positions and scrim (layouts/overlay.css reads its tokens with container
  // style queries), on the playground's overlay slide (header, 4e)
  async function overlay(base, mode) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    // each position: where its text sits across and down the slide's padding box (its lines
    // aligned across too), and its scrim: a radial ramp from its corner, a linear one from its
    // side, an even veil in the centre
    const POSITIONS = {
      'top-left': 'left top radial 0% 0%', top: 'center top linear to bottom', 'top-right': 'right top radial 100% 0%',
      left: 'left center linear to right', center: 'center center even', right: 'right center linear to left',
      'bottom-left': 'left bottom radial 0% 100%', bottom: 'center bottom linear to top', 'bottom-right': 'right bottom radial 100% 100%',
    }
    const POSITION = '--ar-layout-overlay-position'
    const SCRIM = '--ar-layout-overlay-scrim'
    try {
      await page.goto(new URL('playground#/1/1', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      const n = await page.evaluate(() => [...document.querySelectorAll('.ar-viewport .ar-slide')].findIndex((s) => s.classList.contains('layout-overlay')) + 1)
      if (!n) complaints.push('no overlay slide in the playground')
      else {
        await page.goto(new URL(`playground#/${n}/1`, base).href)
        await page.waitForFunction((h) => location.hash === h, `#/${n}/1`, { timeout: 5_000 }).catch(() => {})
        await pause(500)
        // the slide with these tokens set in its style and at :root (null: removed): where its
        // text sits ("<across> <down>"), its title's alignment, its scrim's kind and its darkest
        // alpha, and the slide's attributes
        const read = (slide = {}, root = {}) => page.evaluate(({ i, slide, root }) => {
          const s = document.querySelectorAll('.ar-viewport .ar-slide')[i]
          const set = (el, tokens) => Object.entries(tokens).forEach(([k, v]) => (v == null ? el.style.removeProperty(k) : el.style.setProperty(k, v)))
          set(s, slide)
          set(document.documentElement, root)
          const cs = getComputedStyle(s)
          const r = s.getBoundingClientRect()
          const k = r.width / s.offsetWidth
          const box = { l: r.left + parseFloat(cs.paddingLeft) * k, r: r.right - parseFloat(cs.paddingRight) * k, t: r.top + parseFloat(cs.paddingTop) * k, b: r.bottom - parseFloat(cs.paddingBottom) * k }
          const head = s.querySelector(':scope > .ar-header').getBoundingClientRect()
          const body = s.querySelector(':scope > .ar-body').getBoundingClientRect()
          const text = { l: Math.min(head.left, body.left), r: Math.max(head.right, body.right), t: head.top, b: body.bottom }
          const near = (a, b) => Math.abs(a - b) < 2 * k + 0.5
          const across = near(text.l, box.l) ? 'left' : near(text.r, box.r) ? 'right' : near(text.l + text.r, box.l + box.r) ? 'center' : `at ${Math.round((text.l - box.l) / k)}px`
          const down = near(text.t, box.t) ? 'top' : near(text.b, box.b) ? 'bottom' : near(text.t + text.b, box.t + box.b) ? 'center' : `at ${Math.round((text.t - box.t) / k)}px`
          const bg = getComputedStyle(s.querySelector('.ar-slide-bg'), '::after').backgroundImage
          // each stop's alpha: an rgb() or rgba() (its end, transparent), or a color(srgb r g b / a)
          // (the scrim's colour mixed over transparent, color-mix(), as a browser computes it)
          const alphas = [...bg.matchAll(/rgba?\(([^)]*)\)|color\(srgb ([^)]*)\)/g)].map((m) => {
            if (m[2] != null) return m[2].includes('/') ? parseFloat(m[2].split('/')[1]) : 1
            const c = m[1].split(',')
            return c.length === 4 ? parseFloat(c[3]) : 1
          })
          const kind = bg === 'none' ? 'none'
            : bg.startsWith('radial-gradient(') ? `radial ${bg.match(/at ([\d.]+%) ([\d.]+%)/)?.slice(1).join(' ')}`
              : !bg.startsWith('linear-gradient(') ? bg
                : alphas.length === 2 && alphas[0] === alphas[1] ? 'even' : `linear ${bg.match(/^linear-gradient\((to [a-z]+),/)?.[1] ?? 'to bottom'}`
          // a list in the body: it keeps its own alignment, whatever the position's
          const list = s.querySelector(':scope > .ar-body').appendChild(document.createElement('ul'))
          const listAlign = getComputedStyle(list).textAlign
          list.remove()
          return {
            place: `${across} ${down} ${kind}`,
            align: getComputedStyle(s.querySelector('.ar-title')).textAlign,
            listAlign,
            dark: alphas.length ? Math.max(...alphas) : 0,
            token: s.style.getPropertyValue('--ar-layout-overlay-position').trim(),
            // but its own and a scoped style's (data-v-…, the deck's)
            attrs: [...s.attributes].map((a) => a.name).filter((a) => !['class', 'style', 'data-ar-slide'].includes(a) && !a.startsWith('data-v-')),
          }
        }, { i: n - 1, slide, root })
        // as written: position="top-right", a token in its style, no attribute on the section
        let got = await read()
        if (got.token !== 'top-right') complaints.push(`the playground's overlay: ${POSITION} "${got.token}", not top-right (its position attribute)`)
        if (got.attrs.length) complaints.push(`the playground's overlay: its section has attributes ${got.attrs.join(', ')}`)
        if (got.place !== POSITIONS['top-right']) complaints.push(`position="top-right": "${got.place}", not "${POSITIONS['top-right']}"`)
        for (const [position, want] of Object.entries(POSITIONS)) {
          got = await read({ [POSITION]: position })
          const across = want.split(' ')[0]
          if (got.place !== want) complaints.push(`position ${position}: "${got.place}", not "${want}"`)
          else if (got.align !== across) complaints.push(`position ${position}: its title aligned ${got.align}, not ${across}`)
          else if (got.listAlign !== 'start') complaints.push(`position ${position}: a list in its body aligned ${got.listAlign}, not start (its own)`)
          else if (got.dark < 0.4) complaints.push(`position ${position}: its scrim's darkest is ${got.dark}, at the default strength`)
        }
        // the strength: 0 draws nothing, none no scrim at all, 1 black at the text's side
        got = await read({ [POSITION]: 'bottom-right', [SCRIM]: '0' })
        if (got.dark !== 0) complaints.push(`scrim 0: its darkest is ${got.dark}, not 0`)
        got = await read({ [SCRIM]: 'none' })
        if (!got.place.endsWith(' none')) complaints.push(`scrim none: "${got.place}", no scrim expected`)
        got = await read({ [SCRIM]: '1' })
        if (got.dark !== 1) complaints.push(`scrim 1: its darkest is ${got.dark}, not 1`)
        // a value that is no position (the old place-content) is the default, bottom-left
        got = await read({ [SCRIM]: null, [POSITION]: 'end start' })
        if (got.place !== POSITIONS['bottom-left']) complaints.push(`position "end start": "${got.place}", not the default's "${POSITIONS['bottom-left']}"`)
        // set where a theme sets it, inherited by the slide
        got = await read({ [POSITION]: null }, { [POSITION]: 'top' })
        if (got.place !== POSITIONS.top) complaints.push(`position top at :root: "${got.place}", not "${POSITIONS.top}"`)
        await read({}, { [POSITION]: null })
      }
      console.log(`  ${mode} overlay: ${complaints.length ? 'problems below' : 'nine positions, each its place, alignment (not a list\'s) and scrim; scrim 0, none and 1; any other value the default; from :root too'}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`${mode} overlay: ${c}`)
  }

  // the layouts' names while the dev server runs (src/arao-layouts.d.ts): a layout file added is
  // in it, one removed is out again; an edit that leaves its tokens as they were leaves the file
  // untouched, one that reads a token more adds that parameter, to the file and to the tokens
  // module the dev server serves (virtual:arao/layout-tokens: what the page reloads with), one
  // that writes a doc block adds its doc and its zone to the file, written as an editor that
  // empties the file first and writes it a moment later does: the watcher reports the emptied
  // file and drops the events of the write (they come within its throttle), and the file must
  // still follow (the plugin reads a layout file once its changes have settled). What changes is
  // polled for (until), up to 10 s; only that an edit of no token leaves it untouched is a wait,
  // of many times the plugin's settling
  async function layoutNames(base) {
    const complaints = []
    const file = join(project, 'src', 'layouts', 'smoke-live.css')
    const dts = join(project, 'src', 'arao-layouts.d.ts')
    const own = await ownLayouts()
    const until = async (read, want) => {
      for (let i = 0; i < 100 && (await read()) !== want; i++) await pause(100)
      return read()
    }
    // emptied, then written 20 ms later (two writes: what fs.writeFile does in one go, slowed)
    const emptiedThenWritten = async (text) => {
      const handle = await open(file, 'w')
      try {
        await pause(20)
        await handle.writeFile(text)
      } finally {
        await handle.close()
      }
    }
    try {
      let got = await typedLayouts()
      if (got !== own.join(', ')) complaints.push(`at start it lists ${got ?? 'nothing (no file)'}, not ${own.join(', ')}`)
      const added = [...own, 'smoke-live'].sort().join(', ')
      await writeFile(file, '.layout-smoke-live { --smoke-live: 1; }\n')
      if ((got = await until(typedLayouts, added)) !== added) complaints.push(`with src/layouts/smoke-live.css added it lists ${got}, not ${added}`)
      const before = (await stat(dts)).mtimeMs
      await writeFile(file, '.layout-smoke-live { --smoke-live: 2; }\n')
      await pause(1000)
      if ((await stat(dts)).mtimeMs !== before) complaints.push('an edit of a layout file that changes no token rewrote it')
      await writeFile(file, '.layout-smoke-live { --smoke-live: 2; gap: var(--ar-layout-smoke-live-row-gap, 0); }\n')
      if ((got = await until(() => typedParams('smoke-live'), 'rowGap')) !== 'rowGap') complaints.push(`with a token added to src/layouts/smoke-live.css it types its parameters as ${got}, not rowGap`)
      const served = async () => {
        const code = await fetch(new URL('@id/__x00__virtual:arao/layout-tokens', base)).then((r) => r.text(), () => '')
        return /\\"smoke-live\\":\[\\"row-gap\\"\]/.test(code)
      }
      if (!(await until(served, true))) complaints.push('with a token added to src/layouts/smoke-live.css, virtual:arao/layout-tokens does not have it')
      // a doc block written, by a writer that empties the file first: the file carries it, and
      // the zone it names
      await emptiedThenWritten('/**\n * Live and documented.\n * @zone side  the side\n */\n.layout-smoke-live { --smoke-live: 2; gap: var(--ar-layout-smoke-live-row-gap, 0); }\n')
      const documented = async () => !!typedEntry(await typedInterface('ProjectLayouts'), 'smoke-live')?.includes('Live and documented.') && (await typedZones('smoke-live')) === 'side'
      if (!(await until(documented, true))) complaints.push('with a doc block written in src/layouts/smoke-live.css, it does not carry its doc and its zone')
    } finally {
      await rm(file, { force: true })
    }
    const got = await until(typedLayouts, own.join(', '))
    if (got !== own.join(', ')) complaints.push(`with src/layouts/smoke-live.css removed it lists ${got}, not ${own.join(', ')}`)
    console.log(`  dev layouts' names: ${complaints.length ? 'problems below' : 'a layout file added and removed, src/arao-layouts.d.ts follows, its parameters, its doc and zones too (written emptied first), and the tokens module; an edit of no token leaves it'}`)
    for (const c of complaints) fail(`dev src/arao-layouts.d.ts: ${c}`)
  }

  // the controls (components/internal/Controls.vue), in the audience view of the playground's deck:
  // their keys open and close the jump list (g, Escape) and move the deck; a typed slide number
  // jumps with no list; the project's src/shortcuts.ts remaps, adds and turns off keys; auto-hide: hidden
  // until the mouse moves, shown on a move, hidden again 2.5 s later; a tap in the middle (touch)
  // shows them, another hides them; a tap on a side quarter moves the deck without showing them;
  // the cursor hides after hideCursorAfter. Any console warning, error or page error fails.
  async function controls(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: true })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const state = () => page.evaluate(() => ({
      hash: location.hash,
      visible: !!document.querySelector('.ar-controls.visible'),
      list: !!document.querySelector('.ar-slides'),
      query: document.querySelector('.ar-slides .ar-search')?.value ?? null,
    }))
    try {
      await page.goto(new URL('playground', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(500)
      let s = await state()
      if (s.visible) complaints.push('the controls show before the mouse moves')
      await page.keyboard.press('g')
      await pause(300)
      s = await state()
      if (!s.list) complaints.push('g opens no jump list')
      await page.keyboard.press('Escape')
      await pause(300)
      if ((await state()).list) complaints.push('Escape leaves the jump list open')
      // typing a slide number jumps with nothing on screen (composables/useSlideNumber.ts)
      await page.keyboard.press('3')
      await pause(300)
      s = await state()
      if (s.list) complaints.push('a digit opens the jump list (the jump by number is invisible)')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => location.hash.startsWith('#/3/'), null, { timeout: 5_000 }).catch(() => {})
      await pause(200)
      s = await state()
      if (s.hash !== '#/3/1' || s.list) complaints.push(`3 then Enter: ${s.hash}, list ${s.list ? 'open' : 'closed'}, not #/3/1 and closed (Enter must not also move on)`)
      // a number that is no slide does nothing
      await page.keyboard.press('9'); await page.keyboard.press('9'); await page.keyboard.press('Enter')
      await pause(300)
      if ((await state()).hash !== '#/3/1') complaints.push(`99 then Enter moved the deck to ${(await state()).hash}`)
      // Backspace deletes a digit: 4, Backspace, 2, Enter → slide 2
      for (const k of ['4', 'Backspace', '2', 'Enter']) await page.keyboard.press(k)
      await page.waitForFunction(() => location.hash === '#/2/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await state()).hash !== '#/2/1') complaints.push(`4, Backspace, 2, Enter: ${(await state()).hash}, not #/2/1`)
      // Escape clears a typed number: 5, Escape, Enter is a plain next (one step on, not slide 5)
      await page.keyboard.press('5'); await page.keyboard.press('Escape'); await page.keyboard.press('Enter')
      await pause(300)
      s = await state()
      if (s.hash === '#/2/1' || s.hash.startsWith('#/5/')) complaints.push(`5, Escape, Enter: ${s.hash}, not one step past #/2/1`)
      // the project's src/shortcuts.ts (SHORTCUTS): x and X add next, the code KeyQ (q) prev,
      // End remapped to first, PageUp turned off (the browser's: not prevented, no move)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      const at = async () => (await state()).hash
      await page.keyboard.press('x')
      await pause(250)
      const afterX = await at()
      if (afterX === '#/1/1') complaints.push('shortcuts file: x (added → next) does not move the deck')
      await page.keyboard.press('Shift+X')
      await pause(250)
      if ((await at()) === afterX) complaints.push('shortcuts file: X (Shift+x, letters match either case) does not move the deck')
      await page.keyboard.press('q')
      await pause(250)
      if ((await at()) !== afterX) complaints.push(`shortcuts file: q (code KeyQ → prev, over q → next) leaves ${await at()}, not ${afterX}`)
      await page.keyboard.press('End')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await at()) !== '#/1/1') complaints.push(`shortcuts file: End (remapped → first) leaves ${await at()}, not #/1/1`)
      await page.evaluate(() => {
        window.__arPrevented = null
        window.addEventListener('keydown', (e) => { if (e.key === 'PageUp') setTimeout(() => (window.__arPrevented = e.defaultPrevented)) })
      })
      await page.keyboard.press('ArrowRight')
      await pause(250)
      const beforeUp = await at()
      await page.keyboard.press('PageUp')
      await pause(250)
      if ((await at()) !== beforeUp) complaints.push('shortcuts file: PageUp (turned off) still moves the deck')
      if (await page.evaluate(() => window.__arPrevented) !== false) complaints.push('shortcuts file: PageUp (turned off) is not left to the browser')
      await page.keyboard.press('Home')
      await page.keyboard.press('ArrowRight')
      await pause(200)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await state()).hash !== '#/1/1') complaints.push('Home does not go back to #/1/1')
      if ((await state()).visible) complaints.push('keys showed the controls')
      // auto-hide
      await page.mouse.move(400, 400)
      await page.mouse.move(420, 410)
      await pause(300)
      if (!(await state()).visible) complaints.push('a mouse move does not show the controls')
      await pause(2800)
      if ((await state()).visible) complaints.push('the controls stay shown 2.5 s after the mouse stopped')
      // a tap in the middle shows them, another hides them (the tap's echo mousemove is not the mouse)
      await page.touchscreen.tap(960, 400)
      await pause(400)
      if (!(await state()).visible) complaints.push('a tap in the middle does not show the controls')
      await page.touchscreen.tap(960, 400)
      await pause(400)
      if ((await state()).visible) complaints.push('a second tap in the middle does not hide the controls')
      if ((await state()).hash !== '#/1/1') complaints.push('a tap in the middle moved the deck')
      // a tap on the right quarter moves on, one on the left goes back; neither shows the controls
      await page.touchscreen.tap(1800, 400)
      await page.waitForFunction(() => location.hash !== '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      s = await state()
      if (s.hash === '#/1/1') complaints.push('a tap on the right quarter does not move the deck')
      if (s.visible) complaints.push('a tap on the right quarter showed the controls')
      await page.touchscreen.tap(120, 400)
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      s = await state()
      if (s.hash !== '#/1/1') complaints.push(`a tap on the left quarter leaves ${s.hash}, not #/1/1`)
      if (s.visible) complaints.push('a tap on the left quarter showed the controls')
      // the cursor: shown on a move, hidden after hideCursorAfter (5 s by default) without one
      const cursorHidden = () => page.evaluate(() => !!document.querySelector('.ar-viewport.ar-nocursor'))
      await page.mouse.move(600, 600)
      await pause(300)
      if (await cursorHidden()) complaints.push('the cursor is hidden right after a mouse move')
      await pause(5400)
      if (!(await cursorHidden())) complaints.push('the cursor is still shown 5 s after the mouse stopped')
      console.log(`  dev controls: ${complaints.length ? 'problems below' : 'keys, jump list, auto-hide, taps and cursor as expected'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev controls: ${c}`)
  }

  // speaker notes, on the third deck (5c above); any console warning, error or page error fails
  async function notes(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const open = async (query) => {
      await page.goto(new URL(`${untimed}${query}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(400)
    }
    const panel = () => page.evaluate(() => {
      const out = document.querySelector('.ar-notes-target')
      const shown = (c) => { const el = out?.querySelector(c); return !!el && !el.closest('.ar-step-hidden, .ar-step-collapsed') }
      return {
        notes: out?.querySelectorAll('.ar-note').length ?? -1,
        n1: shown('.n1'), n2: shown('.n2'), n3: shown('.n3'),
        fresh: [...(out?.querySelectorAll('.ar-note-fresh') ?? [])].map((e) => e.className.split(' ')[0]),
        empty: getComputedStyle(document.querySelector('.ar-p-empty')).display !== 'none',
        steps: document.querySelector('.ar-p-notes .ar-p-detail')?.textContent.trim() ?? '',
      }
    })
    try {
      // the audience: two steps on the second slide
      await open('#/2/1')
      await page.keyboard.press('ArrowRight'); await pause(200)
      await page.keyboard.press('ArrowRight'); await pause(200)
      const after = await page.evaluate(() => location.hash)
      if (after !== '#/2/2') complaints.push(`audience: two presses from #/2/1 lead to ${after}, not #/2/2 (a v-step in Notes added a step?)`)
      await open('?presenter#/2/1')
      const one = await panel()
      if (one.notes !== 1) complaints.push(`presenter #/2/1: ${one.notes} notes in the panel, not 1 (the preview's?)`)
      if (!one.n1 || one.n2 || one.n3) complaints.push(`presenter #/2/1: shown n1 ${one.n1}, n2 ${one.n2}, n3 ${one.n3}; want only n1`)
      if (one.steps !== 'Step 1 of 2') complaints.push(`presenter #/2/1: the panel says "${one.steps}", not "Step 1 of 2"`)
      await page.keyboard.press('ArrowRight'); await pause(400)
      const two = await panel()
      if (!two.n1 || !two.n2 || two.n3) complaints.push(`presenter #/2/2: shown n1 ${two.n1}, n2 ${two.n2}, n3 ${two.n3}; want n1 and n2`)
      if (two.fresh.join() !== 'n2') complaints.push(`presenter #/2/2: marked as new: [${two.fresh}], not [n2]`)
      await open('?presenter#/1/1')
      const cover = await panel()
      if (cover.notes !== 0 || !cover.empty) complaints.push(`presenter on the cover (no notes): ${cover.notes} notes, empty notice ${cover.empty}`)
      // the export's notes pages: one, for the second slide, every step of its notes, labelled
      await open('?export&notes')
      await page.waitForSelector('.ar-export-done', { timeout: 60_000 })
      const pages = await page.evaluate(() => [...document.querySelectorAll('.ar-notes-page')].map((pg) => ({
        head: pg.querySelector('.ar-notes-head')?.textContent ?? '',
        shown: ['.n1', '.n2', '.n3'].map((c) => { const el = pg.querySelector(c); return !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).opacity === '1' }),
        label: getComputedStyle(pg.querySelector('.n2'), '::before').content,
      })))
      if (pages.length !== 1 || !pages[0].head.startsWith('Slide 2')) complaints.push(`export: notes pages [${pages.map((p) => p.head)}], want one for slide 2`)
      else {
        if (pages[0].shown.some((v) => !v)) complaints.push(`export: notes shown [${pages[0].shown}], want every step`)
        if (!pages[0].label.includes('From step')) complaints.push(`export: the step-2 note is labelled ${pages[0].label}`)
      }
      console.log(`  dev speaker notes: ${complaints.length ? 'problems below' : 'their steps follow the slide, drawn in the presenter and the notes pages'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev speaker notes: ${c}`)
  }

  // the engine's UI text in the browser's language (5d above), each language in a context of its
  // own: the controls, the presenter view, the list of decks and the notes pages; any console
  // warning, error or page error fails
  async function languages(base) {
    const complaints = []
    const LANGS = [
      // locale, the lang the UI says, the first button's title, the "next" panel, the presenter's
      // window title, the list's heading, a step's label on the notes pages (its two halves)
      { locale: 'de-DE', lang: 'de', first: 'Erste (Pos1)', next: 'Als Nächstes', window: 'Referent · ', heading: 'Präsentationen', head: 'Folie 2', label: ['Ab Schritt ', ''] },
      { locale: 'ja-JP', lang: 'ja', first: '最初へ (Home)', next: '次', window: '発表者 · ', heading: 'プレゼンテーション', head: 'スライド 2', label: ['ステップ ', ' から'] },
      { locale: 'zh-CN', lang: 'zh-Hans', first: '第一页 (Home)', next: '下一步', window: '演讲者 · ', heading: '演示文稿', head: '第 2 张幻灯片', label: ['从第 ', ' 步起'] },
      // no catalogue: English
      { locale: 'pt-BR', lang: 'en', first: 'First (Home)', next: 'Next', window: 'Presenter · ', heading: 'Decks', head: 'Slide 2', label: ['From step ', ''] },
    ]
    for (const want of LANGS) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: want.locale })
      const page = await context.newPage()
      const said = (what) => `${want.locale}: ${what}`
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(said(`console ${m.type()}: ${m.text()}`)))
      page.on('pageerror', (e) => complaints.push(said(`page error: ${e.message}`)))
      const open = async (path) => {
        await page.goto(new URL(path, base).href)
        await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
        await pause(400)
      }
      try {
        await open(untimed)
        const audience = await page.evaluate(() => ({
          lang: document.querySelector('.ar-controls')?.lang,
          first: document.querySelector('.ar-controls .ar-btn')?.title,
        }))
        if (audience.lang !== want.lang || audience.first !== want.first)
          complaints.push(said(`the controls say lang "${audience.lang}", first button "${audience.first}"; want "${want.lang}", "${want.first}"`))
        await open(`${untimed}?presenter`)
        const presenter = await page.evaluate(() => ({
          lang: document.querySelector('.ar-presenter')?.lang,
          next: document.querySelector('.ar-p-next .ar-p-label span')?.textContent.trim(),
          title: document.title,
        }))
        if (presenter.lang !== want.lang || presenter.next !== want.next || !presenter.title.startsWith(want.window))
          complaints.push(said(`the presenter view says lang "${presenter.lang}", "${presenter.next}", window "${presenter.title}"; want "${want.lang}", "${want.next}", "${want.window}…"`))
        await open(`${untimed}?export&notes`)
        await page.waitForSelector('.ar-export-done', { timeout: 60_000 })
        const notes = await page.evaluate(() => {
          const pg = document.querySelector('.ar-notes-page')
          return { head: pg?.querySelector('.ar-notes-head')?.textContent ?? '', label: pg ? getComputedStyle(pg.querySelector('.n2'), '::before').content : '' }
        })
        // the label of the note at step 2, as drawn (its computed content: one string)
        const label = JSON.stringify(want.label.join('2'))
        if (!notes.head.startsWith(want.head) || notes.label !== label)
          complaints.push(said(`the notes page heads "${notes.head}", labels a step ${notes.label}; want "${want.head}…", ${label}`))
        await page.goto(base)
        const list = await page.locator('.ar-decks-heading').textContent({ timeout: 30_000 }).catch(() => null)
        const listLang = await page.evaluate(() => document.querySelector('.ar-decks')?.lang)
        if (list?.trim() !== want.heading || listLang !== want.lang)
          complaints.push(said(`the list of decks is headed "${list}", lang "${listLang}"; want "${want.heading}", "${want.lang}"`))
      } finally {
        await context.close()
      }
    }
    console.log(`  dev UI language: ${complaints.length ? 'problems below' : `${LANGS.map((l) => `${l.locale} → ${l.lang}`).join(', ')}`}`)
    for (const c of complaints) fail(`dev UI language: ${c}`)
  }

  // themes, on the third deck (no themes listed) and the fifth (IMPORTED first), each check in a
  // page of its own; any console warning, error or page error fails
  async function themes(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    const open = async (query, style, deck = untimed) => {
      const page = await context.newPage()
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${deck}${query}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${deck}${query}: page error: ${e.message}`))
      await page.goto(new URL(`${deck}${query.replace(/^&/, '?')}`, base).href)
      if (style) await page.addStyleTag({ content: style })
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return page
    }
    // the theme worn (the viewport's), the canvas's background, the title colour of slide 2 (an
    // h2: its default is the accent), and the root's --ar-bg (a default)
    const look = (page) => page.evaluate(() => {
      const css = (el, p) => (el ? getComputedStyle(el).getPropertyValue(p).trim() : null)
      const title = document.querySelectorAll('.ar-slide')[1]?.querySelector('h2')
      return {
        theme: document.querySelector('.ar-viewport')?.dataset.theme,
        bg: css(document.querySelector('.ar-canvas'), 'background-color'),
        title: css(title, 'color'),
        root: css(document.documentElement, '--ar-bg'),
        picker: document.querySelectorAll('.ar-controls .ar-btn[title^="Theme"]').length,
      }
    })
    // the theme picker, opened: each theme's name and its swatch (its painted gradient)
    const picker = async (page) => {
      await page.evaluate(() => document.querySelector('.ar-controls .ar-btn[title^="Theme"]')?.click())
      await page.waitForSelector('.ar-themes .swatch', { timeout: 5_000 }).catch(() => {})
      return page.evaluate(() => [...document.querySelectorAll('.ar-themes .ar-item')].map((item) => ({
        name: item.querySelector('.t')?.textContent.trim(),
        swatch: getComputedStyle(item.querySelector('.swatch')).backgroundImage,
      })))
    }
    try {
      let page = await open('')
      const plain = await look(page)
      if (plain.theme !== 'default') complaints.push(`no ?theme=: wears "${plain.theme}", not default`)
      if (!plain.root) complaints.push('no default --ar-bg at the root')
      if (!plain.picker) complaints.push('no theme picker in the controls: the deck has one theme, not default and ' + THEME)
      // every theme there is: THEME-extra comes from a partial of brand.css (the plugin follows it)
      const offered = (await picker(page)).map((t) => t.name)
      const builtin = await builtins()
      const all = ['default', THEME, `${THEME}-extra`, ROOM, IMPORTED, LINKED, ...builtin.slice(1)]
      if (JSON.stringify(offered) !== JSON.stringify(all)) complaints.push(`the picker offers ${offered.join(', ') || 'nothing'}, not ${all.join(', ')}`)
      await page.keyboard.press('Escape')
      await page.keyboard.press('t')
      await page.waitForFunction((t) => document.querySelector('.ar-viewport')?.dataset.theme === t, THEME, { timeout: 5_000 }).catch(() => {})
      const cycled = await look(page)
      if (cycled.theme !== THEME || cycled.bg !== SAMPLE.bg) complaints.push(`t: wears "${cycled.theme}" (background ${cycled.bg}), not ${THEME} (${SAMPLE.bg})`)
      await page.close()

      // each built-in theme, asked for: worn, its background its own (default's is the defaults')
      const backgrounds = new Map([[plain.bg, 'default']])
      for (const name of builtin.slice(1)) {
        page = await open(`&theme=${encodeURIComponent(name)}`)
        const worn = await look(page)
        if (worn.theme !== name) complaints.push(`?theme=${name}: wears "${worn.theme}"`)
        else if (backgrounds.has(worn.bg)) complaints.push(`?theme=${name}: its background ${worn.bg} is ${backgrounds.get(worn.bg)}'s`)
        backgrounds.set(worn.bg, name)
        await page.close()
      }

      page = await open(`&theme=${THEME}`)
      const asked = await look(page)
      if (asked.theme !== THEME || asked.bg !== SAMPLE.bg || asked.title !== SAMPLE.accent)
        complaints.push(`?theme=${THEME}: wears "${asked.theme}" (background ${asked.bg}, h2 ${asked.title}), not ${THEME} (${SAMPLE.bg}, ${SAMPLE.accent})`)
      await page.close()

      // outside every theme: the presenter view (its notes, its controls) still reads the defaults;
      // on slide 2 (two steps), its docked controls show the step dots, the first one in their accent
      const presenter = (page) => page.evaluate(() => {
        const box = document.querySelector('.ar-p-notes-body') ?? document.querySelector('.ar-presenter')
        const css = (p) => getComputedStyle(box).getPropertyValue(p).trim()
        const dot = document.querySelector('.ar-controls.docked .ar-dot.on')
        const root = getComputedStyle(document.documentElement)
        return { placeholder: css('--ar-placeholder'), bg: css('--ar-bg'), root: root.getPropertyValue('--ar-bg').trim(),
          dot: dot && getComputedStyle(dot).backgroundColor, shadow: root.getPropertyValue('--ar-presenter-shadow') }
      })
      page = await open('&presenter#/2/1')
      const outside = await presenter(page)
      if (outside.placeholder !== 'currentColor' || !outside.bg || outside.bg !== outside.root)
        complaints.push(`presenter view, outside every theme: --ar-placeholder "${outside.placeholder}", --ar-bg "${outside.bg}" (the root's: "${outside.root}")`)
      const FG = 'rgba(255, 255, 255, 0.94)' // --ar-controls-fg, the docked controls' accent unless set
      if (outside.dot !== FG) complaints.push(`presenter view: the docked controls' step dot is ${outside.dot}, not their text colour ${FG}`)
      await page.close()
      // :root rules reach the presenter view: the docked controls' accent, and the length editor's
      // shadow, which follows the presenter's background
      const ACCENT = 'rgb(4, 5, 6)'
      const PBG = 'rgb(7, 8, 9)'
      page = await open('&presenter#/2/1', `:root { --ar-controls-accent: ${ACCENT}; --ar-presenter-bg: ${PBG}; }`)
      const set = await presenter(page)
      if (set.dot !== ACCENT) complaints.push(`:root { --ar-controls-accent: ${ACCENT} }: the docked controls' step dot is ${set.dot}`)
      if (!set.shadow.includes(PBG)) complaints.push(`:root { --ar-presenter-bg: ${PBG} }: --ar-presenter-shadow is "${set.shadow.trim()}", not drawn from it`)
      await page.close()

      // a :root rule of the project's own wins over a default, and the h2 title (whose default is
      // the accent) follows it; a theme's own value wins over the rule
      const MINE = 'rgb(1, 2, 3)'
      page = await open('', `:root { --ar-accent: ${MINE}; }`)
      const mine = await look(page)
      if (mine.title !== MINE) complaints.push(`:root { --ar-accent: ${MINE} }: the h2 title is ${mine.title}, not ${MINE}`)
      // the picker's swatches: default's shows the rule (what default wears), THEME's its own accent
      const swatches = Object.fromEntries((await picker(page)).map((t) => [t.name, t.swatch]))
      if (!swatches.default?.includes(MINE)) complaints.push(`:root { --ar-accent: ${MINE} }: the swatch of default is ${swatches.default}`)
      if (!swatches[THEME]?.includes(SAMPLE.accent)) complaints.push(`:root { --ar-accent: ${MINE} }: the swatch of ${THEME} is ${swatches[THEME]}, not its own accent ${SAMPLE.accent}`)
      await page.close()
      page = await open(`&theme=${THEME}`, `:root { --ar-accent: ${MINE}; }`)
      const over = await look(page)
      if (over.title !== SAMPLE.accent) complaints.push(`:root { --ar-accent } and ?theme=${THEME}: the h2 title is ${over.title}, not the theme's ${SAMPLE.accent}`)
      await page.close()

      // a theme added to the linked package (outside the root) while the dev server runs: offered
      // by the next page (the plugin watches the package where its files are)
      const LATE = 'late'
      await writeFile(join(`${project}-linked`, 'themes', 'late.css'), `[data-theme="${LATE}"] { --ar-accent: rgb(2, 2, 2); }\n`)
      try {
        let offeredLate = []
        for (let i = 0; i < 20 && !offeredLate.includes(LATE); i++) {
          await pause(500)
          page = await open('')
          offeredLate = (await picker(page)).map((t) => t.name)
          await page.close()
        }
        if (!offeredLate.includes(LATE)) complaints.push(`a theme added to the linked package (${LATE}) is not offered: ${offeredLate.join(', ')}`)
      } finally {
        await rm(join(`${project}-linked`, 'themes', 'late.css'), { force: true })
        await pause(1500)
      }

      // a theme of the theme package, and listed: worn, with no warning
      page = await open('', null, venue)
      const hall = await look(page)
      if (hall.theme !== IMPORTED || hall.bg !== HALL.bg) complaints.push(`/${venue}: wears "${hall.theme}" (background ${hall.bg}), not ${IMPORTED} (${HALL.bg})`)
      await page.close()
      console.log(`  dev themes: ${complaints.length ? 'problems below' : `${all.join(', ')} listed, t and ?theme= wear ${THEME}, ?theme= each built-in theme, defaults outside themes, :root wins over defaults (and reaches the docked controls and default's swatch), themes over :root, ${IMPORTED} (a theme package's) worn`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev themes: ${c}`)
  }

  // the talk's length, on the second deck (duration="15m") and the third (none): edited in the
  // presenter view's bar, in a browser context of its own (its windows share a channel and
  // sessionStorage like the tabs of one browser); any console warning, error or page error fails
  async function duration(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    const open = async (query, who, deck = second) => {
      const page = await context.newPage()
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${who}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${who}: page error: ${e.message}`))
      await page.goto(new URL(`${deck}${query.replace(/^&/, '?')}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return page
    }
    // ms as the bar writes it (state/timer.ts clock): 1:30:00, 20:00
    const clock = (ms) => {
      const t = Math.floor(ms / 1000)
      const [h, m, sec] = [Math.floor(t / 3600), Math.floor(t / 60) % 60, String(t % 60).padStart(2, '0')]
      return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
    }
    // the presenter's bar shows the length on its button, the time left under the timer, and
    // marks a length that is not the deck's (.changed); no length (ms null): "length" and no
    // time left. Waits for it, says what it saw otherwise
    const shows = async (page, ms, changed, when) => {
      const want = { button: ms ? clock(ms) : 'length', left: ms ? `${clock(ms)} left` : null, changed }
      const read = () => page.evaluate(() => ({
        button: document.querySelector('.ar-p-dur')?.textContent.trim(),
        left: document.querySelector('.ar-p-sub')?.textContent.match(/[\d:]+ left/)?.[0] ?? null,
        changed: !!document.querySelector('.ar-p-dur.changed'),
      }))
      const ok = await page.waitForFunction((w) => {
        const b = document.querySelector('.ar-p-dur')
        const sub = document.querySelector('.ar-p-sub')?.textContent ?? ''
        return b?.textContent.trim() === w.button && (w.left ? sub.includes(w.left) : !sub.includes(' left'))
          && b.classList.contains('changed') === w.changed
      }, want, { timeout: 5_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: the bar shows ${JSON.stringify(await read())}, not ${JSON.stringify(want)}`)
    }
    // every face of the audience window reads the length (useDeck().duration)
    const hears = async (page, ms, when) => {
      const ok = await page.waitForFunction((w) => window.__faces?.length && window.__faces.every((f) => f.duration.value === w), ms, { timeout: 5_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: the audience reads ${await page.evaluate(() => JSON.stringify(window.__faces?.map((f) => f.duration.value)))}, not ${ms}`)
    }
    const editor = (page) => page.locator('.ar-p-edit')
    const input = (page) => page.locator('.ar-p-edit input')
    const isOpen = async (page) => (await editor(page).count()) > 0
    const focusOn = (page, selector) => page.evaluate((s) => !!document.activeElement?.matches(s), selector)
    const hash = (page) => page.evaluate(() => location.hash)
    // a key that must move the slides (the hash changes); the timer is then put back to idle, so
    // the time left reads the whole length again
    const moves = async (page, key, when) => {
      const was = await hash(page)
      await page.keyboard.press(key)
      const ok = await page.waitForFunction((h) => location.hash !== h, was, { timeout: 2_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: ${key} did not move the slides (still at ${was || '#/1/1'})`)
      const rewind = page.locator('.ar-p-timer > button').nth(1)
      if (await rewind.isEnabled()) await rewind.click()
    }
    // keys that must move nothing: the hash stays, and no jump menu opens
    const still = async (page, keys, when) => {
      const was = await hash(page)
      await keys()
      await pause(200)
      const at = await hash(page)
      if (at !== was) complaints.push(`${when}: the slides moved (${was || '#/1/1'} → ${at})`)
      if (await page.locator('.ar-slides').count()) complaints.push(`${when}: the jump menu opened`)
    }
    const error = async (page, has, when) => {
      const msg = await page.locator('.ar-p-edit-msg.bad').textContent({ timeout: 2_000 }).catch(() => '')
      const invalid = await page.locator('.ar-p-edit input[aria-invalid="true"]').count()
      if (!has.every((h) => msg.includes(h)) || !invalid) complaints.push(`${when}: no inline error with ${has.join(', ')} (${JSON.stringify(msg)})`)
    }
    try {
      const presenter = await open('&presenter', 'presenter')
      let audience = await open('', 'audience')
      await shows(presenter, DURATION, false, 'opened')
      await hears(audience, DURATION, 'opened')

      // with the mouse, then real keys: 1h30 types into the field (its digits open no jump menu,
      // nothing moves), Enter applies
      await presenter.click('.ar-p-dur')
      await still(presenter, () => presenter.keyboard.type('1h30'), 'typing 1h30')
      const typed = await input(presenter).inputValue().catch(() => null)
      if (typed !== '1h30') complaints.push(`typing 1h30: the field holds ${JSON.stringify(typed)}`)
      await still(presenter, () => presenter.keyboard.press('Enter'), 'Enter on 1h30')
      await shows(presenter, 90 * 60000, true, 'set to 1h30')
      if (await isOpen(presenter)) complaints.push('set to 1h30: the editor is still open')
      await hears(audience, 90 * 60000, 'set to 1h30')

      // with the keyboard alone: focus the button, Enter opens with the input focused; 20m, Enter
      // applies, and the focus rests next to the button (not on it): Space moves the slides
      const set = 20 * 60000
      await presenter.locator('.ar-p-dur').focus()
      await presenter.keyboard.press('Enter')
      if (!(await focusOn(presenter, '.ar-p-edit input'))) complaints.push('Enter on the length button: the input does not have the focus')
      await presenter.keyboard.type('20m')
      await presenter.keyboard.press('Enter')
      await shows(presenter, set, true, 'set to 20m from the keyboard')
      if (!(await focusOn(presenter, '.ar-p-length'))) complaints.push('an apply from the keyboard: the focus is not on the length group')
      await moves(presenter, ' ', 'Space after an apply from the keyboard')
      if (await isOpen(presenter)) complaints.push('Space after an apply from the keyboard: the editor opened again')

      // an invalid length shows its error and keeps the editor; Escape cancels, the focus on the
      // length group again, and ArrowRight moves the slides
      await presenter.locator('.ar-p-dur').focus()
      await presenter.keyboard.press('Enter')
      await presenter.keyboard.type('abc')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['abc'], 'an invalid length')
      await presenter.keyboard.press('Escape')
      if (await isOpen(presenter)) complaints.push('Escape: the editor is still open')
      if (!(await focusOn(presenter, '.ar-p-length'))) complaints.push('Escape: the focus is not on the length group')
      await shows(presenter, set, true, 'after an invalid length and Escape')
      await moves(presenter, 'ArrowRight', 'ArrowRight after Escape')
      await moves(presenter, 'Home', 'Home') // back to the start: the keys below would move it

      // out of bounds (1 min – 24 h): an error each, nothing changes
      await presenter.click('.ar-p-dur')
      await input(presenter).fill('30s')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['30s', '1 minute'], 'a length under a minute')
      await input(presenter).fill('25h')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['25h', '24 hours'], 'a length over 24 hours')
      if (!(await isOpen(presenter))) complaints.push('a length out of bounds: the editor closed')

      // the focus on the editor's button (Tab from the field): no key moves the slides; Tab past
      // its last button closes it, applying nothing
      await input(presenter).focus()
      await presenter.keyboard.press('Tab')
      if (!(await focusOn(presenter, '.ar-p-edit button'))) complaints.push('Tab from the field: the focus is not on a button of the editor')
      await still(presenter, () => presenter.keyboard.press('ArrowRight'), 'ArrowRight on the editor\'s button')
      if (!(await isOpen(presenter))) complaints.push('ArrowRight on the editor\'s button: the editor closed')
      for (let i = 0; i < 4 && (await presenter.evaluate(() => !!document.activeElement?.closest('.ar-p-edit'))); i++) await presenter.keyboard.press('Tab')
      await pause(100)
      if (await isOpen(presenter)) complaints.push('Tab out of the editor: it is still open')
      await shows(presenter, set, true, 'after Tab out of the editor')

      // a change from another presenter window while the editor is open: the field follows it
      // while nothing was typed, typed text stays; a notice says so either way
      const other = await open('&presenter', 'presenter 2')
      const elsewhere = async (text) => {
        await other.click('.ar-p-dur')
        await input(other).fill(text)
        await other.keyboard.press('Enter')
      }
      await presenter.click('.ar-p-dur')
      await elsewhere('25m')
      const follows = await presenter.waitForFunction(() => document.querySelector('.ar-p-edit input')?.value === '25:00'
        && document.querySelector('.ar-p-edit-note')?.textContent.includes('25:00'), null, { timeout: 5_000 }).then(() => true, () => false)
      if (!follows) complaints.push('a change elsewhere, nothing typed: the open field does not follow it with a notice')
      await input(presenter).fill('40m')
      await elsewhere('30m')
      const keeps = await presenter.waitForFunction(() => document.querySelector('.ar-p-edit input')?.value === '40m'
        && document.querySelector('.ar-p-edit-note')?.textContent.includes('30:00'), null, { timeout: 5_000 }).then(() => true, () => false)
      if (!keeps) complaints.push('a change elsewhere over typed text: the field does not keep it with a notice')
      await presenter.keyboard.press('Escape')
      await other.close()
      const later = 30 * 60000
      await shows(presenter, later, true, 'set to 30m in another window')

      // a reload with no other window open keeps it; a new audience window takes it
      await audience.close()
      await presenter.reload()
      await presenter.waitForSelector('.ar-p-dur', { timeout: 30_000 })
      await shows(presenter, later, true, 'reloaded alone')
      audience = await open('', 'audience')
      await hears(audience, later, 'a new audience window')

      // back to the deck's
      await presenter.click('.ar-p-dur')
      await presenter.click('.ar-p-reset')
      await shows(presenter, DURATION, false, 'reset')
      await hears(audience, DURATION, 'reset')
      await presenter.close()
      await audience.close()

      // a deck with no duration: none shown; one set adds the countdown, the reset removes it
      const plain = await open('&presenter', 'presenter (no duration)', untimed)
      await shows(plain, null, false, 'no duration: opened')
      await plain.click('.ar-p-dur')
      await input(plain).fill('10m')
      await plain.keyboard.press('Enter')
      await shows(plain, 10 * 60000, true, 'no duration: set to 10m')
      await plain.click('.ar-p-dur')
      const offer = (await plain.locator('.ar-p-reset').textContent({ timeout: 2_000 }).catch(() => '')).trim()
      if (!offer.includes('Remove')) complaints.push(`no duration: the reset offers ${JSON.stringify(offer)}`)
      await plain.click('.ar-p-reset')
      await shows(plain, null, false, 'no duration: reset')
      console.log(`  dev duration: ${complaints.length ? 'problems below' : '15:00 → 1h30, 20m (keys), 30m (another window) in every window, kept on reload, reset to 15:00; none → 10m → none'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev duration: ${c}`)
  }


  // the presenter window: "p" in the audience's window opens the deck's path with ?presenter, and
  // the two move together, either way; a window of another deck stays where it is
  async function presenter(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    // where a window stands (no hash: the first step), and waiting for it to stand somewhere
    const at = (p) => p.evaluate(() => location.hash || '#/1/1')
    const reaches = (p, hash) => p.waitForFunction((h) => (location.hash || '#/1/1') === h, hash, { timeout: 5_000 }).then(() => true, () => false)
    const opened = async (p, path) => {
      await p.goto(new URL(path, base).href)
      await p.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
    }
    try {
      const audience = await context.newPage()
      await opened(audience, second)
      const [win] = await Promise.all([context.waitForEvent('page', { timeout: 10_000 }), audience.keyboard.press('p')])
      await win.waitForSelector('.ar-presenter', { timeout: 30_000 })
      await pause(500)
      const url = new URL(win.url())
      if (url.pathname !== new URL(second, base).pathname || !url.searchParams.has('presenter'))
        complaints.push(`"p" opened ${url.pathname}${url.search}, not /${second}?presenter`)
      await audience.keyboard.press('ArrowRight')
      const one = await at(audience)
      if (one === '#/1/1') complaints.push('ArrowRight did not move the audience')
      else if (!(await reaches(win, one))) complaints.push(`the presenter window did not follow the audience to ${one} (at ${await at(win)})`)
      await win.keyboard.press('ArrowRight')
      const two = await at(win)
      if (two === one) complaints.push('ArrowRight did not move the presenter window')
      else if (!(await reaches(audience, two))) complaints.push(`the audience did not follow the presenter window to ${two} (at ${await at(audience)})`)
      // "p" is no shortcut of the presenter view: it opens no other window there
      const extra = context.waitForEvent('page', { timeout: 1_500 }).then(() => true, () => false)
      await win.keyboard.press('p')
      if (await extra) complaints.push('"p" in the presenter window opened another window')
      const stranger = await context.newPage()
      await opened(stranger, encodeURIComponent(other))
      await audience.keyboard.press('ArrowLeft')
      await reaches(win, await at(audience))
      await pause(300)
      if ((await at(stranger)) !== '#/1/1') complaints.push(`/${other} moved along with /${second}: at ${await at(stranger)}`)
      console.log(`  dev presenter window: ${complaints.length ? 'problems below' : `${url.pathname}${url.search}, in step both ways; /${other} apart`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev presenter window: ${c}`)
  }

  // a deck's window, open at /<second>#/2/1, stays where it is (its hash, and its timer, idle)
  // while the list is opened in another window of the same browser and reloaded there: the
  // covers drawn in the list join no deck's windows
  async function apart(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    try {
      const deck = await context.newPage()
      await deck.goto(new URL(`${second}#/2/1`, base).href)
      await deck.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      const state = () => deck.evaluate(() => JSON.stringify({ hash: location.hash, timer: window.__faces[0].timer.value }))
      const was = await state()
      if (JSON.parse(was).hash !== '#/2/1') complaints.push(`/${second}#/2/1 opened at ${JSON.parse(was).hash}`)
      const list = await context.newPage()
      for (const how of ['opened', 'reloaded']) {
        await (how === 'opened' ? list.goto(base) : list.reload())
        const drawn = await list.waitForFunction((n) => {
          const cards = [...document.querySelectorAll('.ar-decks-card')]
          return cards.length === n && cards.every((c) => c.querySelector('.ar-thumb .ar-slide'))
        }, decks.length, { timeout: 30_000 }).then(() => true, () => false)
        if (!drawn) complaints.push(`the list ${how}: not every cover drawn`)
        await pause(500)
        const is = await state()
        if (is !== was) complaints.push(`the list ${how} in another window: /${second} went from ${was} to ${is}`)
      }
      console.log(`  dev list beside a deck: ${complaints.length ? 'problems below' : `/${second}#/2/1 stays put, its timer as it was, while / opens and reloads`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev list beside a deck: ${c}`)
  }

  const second = basename(SECOND[0], '.vue').toLowerCase()
  const untimed = basename(UNTIMED[0], '.vue').toLowerCase()
  const other = decks.find((d) => d.toLowerCase() !== second && d.toLowerCase() !== untimed)
  const venue = basename(VENUE[0], '.vue').toLowerCase()
  for (const mode of ['dev', 'preview']) {
    log(`walking the decks under vite ${mode}`)
    const base = await serve(mode)
    try {
      // the dev server may optimise dependencies on the first visit and reload: let it settle
      if (mode === 'dev') {
        const warm = await browser.newPage()
        await warm.goto(base)
        await warm.waitForLoadState('networkidle').catch(() => {})
        await pause(1000)
        await warm.close()
      }
      for (const deck of decks) await walk(base, deck, mode)
      // the playground's deck lists no themes: it offers every built-in one, each walked
      const builtin = await builtins()
      if (builtin[0] !== 'default' || builtin.length < 2) fail(`the package's built-in themes are ${builtin.join(', ')}: not default and more`)
      for (const name of builtin.slice(1)) await walk(base, 'playground', mode, `?theme=${encodeURIComponent(name)}`)
      await selector(base, mode)
      await layoutParams(base, mode)
      await deckSlides(base, mode)
      await utilities(base, mode)
      await overlay(base, mode)
      await fits(base, mode, builtin)
      await sectionAgendas(base, mode, builtin)
      if (mode === 'dev') {
        await face(base)
        await themes(base)
        await controls(base)
        await backgrounds(base)
        await layoutNames(base)
        await notes(base)
        await languages(base)
        await duration(base)
        await presenter(base)
        await apart(base)
      }
    } finally {
      await stop()
    }
  }

  // tiny decks, for the decks folders of the cases below: a cover and a slide of two steps
  const tiny = (title, themes, script = '') => `<template lang="pug">
Deck(:themes="${JSON.stringify(themes).replace(/"/g, "'")}")
  Slide(layout="cover")
    h1 ${title}
  Slide
    h2 Two steps
    p(v-step="2") The second.
</template>
${script}`
  // a deck that throws once it runs (the export's case), and one that throws as it is drawn
  // (its setup: the list's case)
  const THROWS = `<script setup>
setTimeout(() => { throw new Error('smoke: this deck throws at runtime') })
</script>
`
  const THROWS_DRAWN = `<script setup>
throw new Error('smoke: this deck throws as it is drawn')
</script>
`

  // createDeckApp's other cases: the project's own files rewritten for each one, the dev server
  // started on them (Vue's warnings only exist in dev, and no build is needed), and put back.
  // Each visit opens a path and expects the second deck (`deck`; `theme`: the theme it must wear)
  // or the list (`list`: so many decks, each with its cover; `covers`: the theme each one wears,
  // by deck); `warns`: the one [arao] warning the page must give. Each check is a function of its
  // own, given the site's URL.
  const solo = 'src/solo' // a decks folder holding the second deck alone
  // a decks folder holding two copies of the second deck: one lists a theme there is not before
  // THEME, the other no theme there is
  const listed = 'src/listed'
  const LISTED = {
    'Listed.vue': SECOND[1].replace(`:themes="['default', '${THEME}']"`, `:themes="['nosuch', '${THEME}']"`),
    'Nameless.vue': SECOND[1].replace(`:themes="['default', '${THEME}']"`, `:themes="['nosuch']"`),
  }
  const crowd = 'src/crowd' // a decks folder of many decks, one of which cannot be drawn
  const asIs = { 'src/main.js': files['src/main.js'], 'vite.config.js': files['vite.config.js'] }
  const alone = asIs['vite.config.js'].replace('arao({', `arao({ decks: '${solo}',`)
  const withOptions = (o) => asIs['src/main.js'].replace('createDeckApp()', `createDeckApp(${o})`)
  // a decks folder holding a deck whose overlay slides give its parameters values: some it takes
  // (a position, a number in its range, a word of its scrim's), some it does not (twice one)
  const valued = 'src/valued'
  const VALUED = { 'Valued.vue': `<template lang="pug">
Deck
  Slide(layout="overlay" position="top-right" scrim=".4")
    h2 Taken
  Slide(layout="overlay" position="nowhere" scrim="lots")
    h2 Not taken
  Slide(layout="overlay" position="nowhere" scrim="2")
    h2 Again, and out of its range
  Slide(layout="overlay" scrim="none")
    h2 A word its scrim takes
</template>
` }
  const crowded = { 'Broken.vue': tiny('Broken', ['default'], THROWS_DRAWN), 'Café.vue': tiny('Café', ['default']) }
  for (let i = 1; i <= 12; i++) crowded[`Deck${String(i).padStart(2, '0')}.vue`] = tiny(`Deck ${i}`, ['default'])

  // a project's only deck opens at / and at /<second>: the two windows are one deck's, in step
  // either way, / staying / in the address bar; "p" at / opens the presenter at /<second>?presenter
  async function together(base, variant) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    const at = (p) => p.evaluate(() => location.hash || '#/1/1')
    const reaches = (p, hash) => p.waitForFunction((h) => (location.hash || '#/1/1') === h, hash, { timeout: 5_000 }).then(() => true, () => false)
    const opened = async (path) => {
      const p = await context.newPage()
      await p.goto(new URL(path, base).href)
      await p.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return p
    }
    try {
      const root = await opened('')
      const named = await opened(second)
      await root.keyboard.press('ArrowRight')
      const one = await at(root)
      if (one === '#/1/1') complaints.push('ArrowRight did not move /')
      else if (!(await reaches(named, one))) complaints.push(`/${second} did not follow / to ${one} (at ${await at(named)})`)
      await named.keyboard.press('ArrowRight')
      const two = await at(named)
      if (two === one) complaints.push(`ArrowRight did not move /${second}`)
      else if (!(await reaches(root, two))) complaints.push(`/ did not follow /${second} to ${two} (at ${await at(root)})`)
      const path = await root.evaluate(() => location.pathname)
      if (path !== new URL(base).pathname) complaints.push(`/ became ${path}`)
      const [win] = await Promise.all([context.waitForEvent('page', { timeout: 10_000 }), root.keyboard.press('p')])
      await win.waitForSelector('.ar-presenter', { timeout: 30_000 })
      const url = new URL(win.url())
      if (url.pathname !== new URL(second, base).pathname || !url.searchParams.has('presenter'))
        complaints.push(`"p" at / opened ${url.pathname}${url.search}, not /${second}?presenter`)
      else if (!(await reaches(win, two))) complaints.push(`the presenter window is at ${await at(win)}, not ${two}`)
      console.log(`  dev ${variant.name}: / and /${second} in step both ways, / kept; "p" opens ${url.pathname}${url.search}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}, / and /${second}: ${c}`)
  }

  // a long list on a phone (390x844): the covers far below the screen are not drawn until they
  // are scrolled to; a deck that cannot be drawn says "No preview" (with one [arao]
  // warning) and the rest of the list goes on; a path is shown as written (/café), not encoded
  async function lazy(base, variant) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const complaints = []
    let expected = 'broken' // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().startsWith('[arao]') && m.text().includes(`"${expected}"`)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const card = (name) => page.locator(`.ar-decks-card:has(a[href$="/${encodeURIComponent(name)}"])`)
    try {
      await page.goto(base)
      const count = Object.keys(crowded).length
      await page.locator('.ar-decks-card').nth(count - 1).waitFor({ state: 'attached', timeout: 30_000 }).catch(() => {})
      const cards = await page.locator('.ar-decks-card').count()
      if (cards !== count) complaints.push(`the list has ${cards} decks, not ${count}`)
      const failed = await card('broken').locator('.ar-cover-failed').waitFor({ timeout: 30_000 }).then(() => true, () => false)
      const says = failed ? (await card('broken').locator('.ar-cover-failed').textContent()).trim() : null
      if (says !== 'No preview') complaints.push(`the deck that throws shows ${says == null ? 'no failure' : JSON.stringify(says)}, not "No preview"`)
      const firstDrawn = await card('café').locator('.ar-thumb .ar-slide').first().waitFor({ state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      if (!firstDrawn) complaints.push('the cards on screen have no cover drawn')
      const shown = (await card('café').locator('.ar-decks-path').textContent().catch(() => '')).trim()
      if (shown !== `${new URL(base).pathname}café`) complaints.push(`the path of Café is shown as ${shown}`)
      await pause(1000)
      const last = card('deck12')
      const early = await last.locator('.ar-slide').count()
      if (early) complaints.push('the last card, far below the screen, has its cover drawn before it is scrolled to')
      await last.scrollIntoViewIfNeeded()
      const later = await last.locator('.ar-thumb .ar-slide').first().waitFor({ state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      if (!later) complaints.push('the last card has no cover once scrolled to')
      await pause(300)
      if (expected) complaints.push('no [arao] console warning naming "broken"')
      console.log(`  dev ${variant.name}: ${cards} cards at 390x844; the last drawn only once scrolled to; Broken: ${says}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}: ${c}`)
  }

  // A slide that does not fit warns in development, once per step it overflows at, naming the
  // deck, the slide, its title and step, what overflows and by how many px, and the fixes; the
  // same overflow said once (back at a step already said: nothing); a slide that reaches past its
  // box by design says nothing. In a window of another size than the canvas (1600x900): measured
  // on the canvas all the same, the px the export says too (overflowPx, the CLI's case below).
  let overflowPx = null
  async function overflowWarnings(base, variant) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
    const complaints = []
    const warned = []
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (m.type() === 'warning' && m.text().startsWith('[arao] overflow: ')) warned.push(m.text())
      else complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const at = async (hash) => {
      await page.evaluate((h) => { location.hash = h }, hash)
      await page.waitForFunction((h) => location.hash === h, hash, { timeout: 5_000 }).catch(() => complaints.push(`${hash} not reached`))
      await pause(1500)
    }
    try {
      await page.goto(new URL('overflowing#/1/1', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(1500)
      if (warned.length) complaints.push(`a warning at step 1, where it fits: ${warned.join(' | ')}`)
      for (const hash of ['#/1/2', '#/1/3', '#/1/2', '#/2/1', '#/1/3']) await at(hash)
      // the third and fourth slides: Slide.fit left whole (a block in px, a paragraph pulled out)
      const fitted = []
      for (const hash of ['#/3/1', '#/4/1']) {
        await at(hash)
        fitted.push(await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].find((e) => getComputedStyle(e).display !== 'none')?.querySelector(':scope > .ar-body')?.style.getPropertyValue('--_ar-fit') || '1'))
      }
      if (fitted.some((v) => v !== '1')) complaints.push(`Slide.fit shrank a body it cannot help (--_ar-fit ${fitted.join(', ')} on slides 3 and 4, not 1)`)
      const said = (step) => new RegExp(`^\\[arao\\] overflow: deck "Overflowing", slide 1 "${OVERFLOW_TITLE}", step ${step} of 3: the body overflows by (\\d+)px at the bottom, (under the footer|past the slide's edge \\(cut off\\))\\. To fit it: Slide\\.fit \\(.*\\), a \\.scale-90, \\.scale-80 or \\.scale-70 class on the slide or on a block, or fewer blocks\\.$`)
      const stuck = /^\[arao\] overflow: deck "Overflowing", slide 3 "Too wide for fit": the body overflows by \d+px at the right\. Slide\.fit cannot shrink it \(it is sized in px by hand, or transformed\): make it smaller, or fewer blocks\.$/
      const placed = /^\[arao\] overflow: deck "Overflowing", slide 4 "Pulled to the left": the body overflows by \d+px at the left\. Past the top or the left it is placed, not pushed .*position: absolute or data-ar-bleed.*\.$/
      const [two, three] = [said(2).exec(warned[0] ?? ''), said(3).exec(warned[1] ?? '')]
      if (warned.length !== 4 || !two || !three || !stuck.test(warned[2]) || !placed.test(warned[3])) complaints.push(`not one warning for step 2 and one for step 3 of slide 1 (${said(2)}), then one for slide 3 (${stuck}) and one for slide 4 (${placed}), but ${warned.length}: ${warned.join(' | ') || 'none'}`)
      else if (two[1] !== three[1]) complaints.push(`steps 2 and 3 overflow alike, and the warnings say ${two[1]}px and ${three[1]}px`)
      else overflowPx = Number(two[1])
      console.log(`  dev ${variant.name}: ${complaints.length ? 'problems below' : `one warning at step 2, one at step 3 (${overflowPx}px), none again, none for a slide past its box by design; fit left whole where it cannot help, its fix said (px, placed)`}`)
    } finally {
      await page.context().close()
    }
    for (const c of complaints) fail(`dev ${variant.name}: ${c}`)
  }

  // a layout parameter given a value its doc block does not list: one [arao] warning per layout,
  // parameter and value, saying what it takes, however many slides give it and however often
  // they are drawn; none for a value it lists (a word, a number in its range)
  async function valueWarnings(base, variant) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    const warned = []
    const PREFIX = '[arao] Slide(layout="overlay") '
    page.on('console', (m) => {
      if (m.type() === 'warning' && m.text().startsWith(PREFIX)) warned.push(m.text().slice(PREFIX.length))
      else if (['warning', 'error'].includes(m.type())) complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const WANTED = [
      'position="nowhere": it takes one of top-left, top, top-right, left, center, right, bottom-left, bottom, bottom-right',
      'scrim="lots": it takes a number from 0 to 1, or none',
      'scrim="2": it takes a number from 0 to 1, or none',
    ]
    try {
      await page.goto(base)
      const opened = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      if (!opened) complaints.push('the deck did not open')
      // every slide drawn again as the deck moves
      for (let k = 0; k < 3; k++) {
        await page.keyboard.press('ArrowRight')
        await pause(200)
      }
      await pause(500)
      for (const w of WANTED) {
        const n = warned.filter((t) => t.startsWith(w)).length
        if (n !== 1) complaints.push(`${n} warnings "${PREFIX}${w}…", not 1`)
      }
      const others = warned.filter((t) => !WANTED.some((w) => t.startsWith(w)))
      if (others.length) complaints.push(`warnings for values it takes: ${others.join(' / ')}`)
      console.log(`  dev ${variant.name}: ${complaints.length ? 'problems below' : 'one warning per value it does not take (position, scrim), saying what it takes; none for a word or a number in range'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}: ${c}`)
  }

  const overflowing = 'src/overflowing' // a decks folder holding OVERFLOWING
  const variants = [
    { name: 'a deck that overflows', files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${overflowing}',`) },
      checks: [overflowWarnings] },
    { name: 'one deck', files: { 'vite.config.js': alone },
      visits: [{ path: '', deck: true }, { path: second, deck: true }], checks: [together] },
    { name: `one deck, createDeckApp({ deckList: 'always' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'always' }`) },
      visits: [{ path: '', list: 1 }, { path: second, deck: true }] },
    { name: `one deck, createDeckApp({ deckList: 'sometimes' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'sometimes' }`) },
      visits: [{ path: '', deck: true, warns: 'deckList' }] },
    { name: 'a long list', files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${crowd}',`) },
      checks: [lazy] },
    { name: 'layout parameters given values they do not take', files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${valued}',`) },
      checks: [valueWarnings] },
    { name: `Deck(:themes="['nosuch', '${THEME}']") and Deck(:themes="['nosuch']")`, files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${listed}',`) },
      visits: [{ path: '', list: 2, covers: { listed: THEME, nameless: 'default' } },
        { path: 'listed', deck: true, theme: THEME, warns: '"nosuch"' }, { path: 'nameless', deck: true, theme: 'default', warns: '"nosuch"' }] },
  ]

  async function visit(base, variant, { path, deck, list, warns, theme, covers }) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    let expected = warns // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().startsWith('[arao]') && m.text().includes(expected)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL(path, base).href)
      if (deck) {
        const slides = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
        const isSecond = (await page.locator('.ar-slide h1', { hasText: MARK }).count()) > 0
        if (!slides || (await page.locator('.ar-decks').count())) complaints.push('no deck opened')
        else if (!isSecond) complaints.push('opened another deck, not the second')
        const worn = await page.evaluate(() => document.querySelector('.ar-viewport')?.dataset.theme)
        if (theme && worn !== theme) complaints.push(`wears the theme "${worn}", not ${theme}`)
      } else {
        await page.locator('.ar-decks-card').first().waitFor({ timeout: 30_000 }).catch(() => {})
        const cards = await page.locator('.ar-decks-card').count()
        if (cards !== list) complaints.push(`the list has ${cards} decks, not ${list}`)
        // drawn, and each cover's theme set (a slower dev server sets it a moment after the slide)
        const drawn = await page.waitForFunction((n) => document.querySelectorAll('.ar-decks-card .ar-thumb .ar-slide').length >= n
          && document.querySelectorAll('.ar-decks-card .ar-thumb[data-theme]').length >= n, list, { timeout: 30_000 })
          .then(() => true, () => false)
        if (!drawn) complaints.push('a card has no cover drawn in it')
        const worn = Object.fromEntries(await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) =>
          [c.querySelector('a')?.getAttribute('href').split('?')[0].split('/').pop(), c.querySelector('.ar-thumb')?.dataset.theme ?? null])))
        for (const [name, want] of Object.entries(covers ?? {}))
          if (worn[name] !== want) complaints.push(`the cover of ${name} wears "${worn[name]}", not ${want}`)
      }
      await pause(300) // late warnings
      if (expected) complaints.push(`no [arao] console warning naming ${expected}`)
      console.log(`  dev ${variant.name}, /${path}: ${deck ? 'the deck' : 'the list'}${complaints.length ? ' (problems below)' : ''}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}, /${path}: ${c}`)
  }

  log(`createDeckApp's other cases under vite dev`)
  await mkdir(join(project, solo), { recursive: true })
  await writeFile(join(project, solo, SECOND[0]), SECOND[1])
  await mkdir(join(project, crowd), { recursive: true })
  for (const [name, text] of Object.entries(crowded)) await writeFile(join(project, crowd, name), text)
  await mkdir(join(project, listed), { recursive: true })
  for (const [name, text] of Object.entries(LISTED)) await writeFile(join(project, listed, name), text)
  await mkdir(join(project, overflowing), { recursive: true })
  await writeFile(join(project, overflowing, OVERFLOWING[0]), OVERFLOWING[1])
  await mkdir(join(project, valued), { recursive: true })
  for (const [name, text] of Object.entries(VALUED)) await writeFile(join(project, valued, name), text)
  try {
    for (const variant of variants) {
      for (const [name, text] of Object.entries({ ...asIs, ...variant.files })) await writeFile(join(project, name), text)
      const base = await serve('dev')
      try {
        for (const v of variant.visits ?? []) await visit(base, variant, v)
        for (const check of variant.checks ?? []) await check(base, variant)
      } finally {
        await stop()
      }
    }
  } finally {
    for (const [name, text] of Object.entries(asIs)) await writeFile(join(project, name), text)
    await rm(join(project, solo), { recursive: true, force: true })
    await rm(join(project, crowd), { recursive: true, force: true })
    await rm(join(project, listed), { recursive: true, force: true })
    await rm(join(project, overflowing), { recursive: true, force: true })
    await rm(join(project, valued), { recursive: true, force: true })
  }

  // the summary line of a PDF: "<path>: <pages> pages (<slides> slides, <steps> steps), …"
  const summary = (said, file) => {
    const line = said.split('\n').find((l) => l.startsWith(`${file}: `))
    const [, pages, slides, steps] = line?.match(/: (\d+) pages \((\d+) slides, (\d+) steps\)/) ?? []
    return line && { pages: Number(pages), slides: Number(slides), steps: Number(steps) }
  }
  const pdfAt = async (file) => ((await stat(join(project, file)).catch(() => null))?.size ?? 0) > 0
  // the pages of a PDF, counted in the file (its /Type /Page objects), not taken from the CLI;
  // 0 if there is no file
  const pagesIn = async (file) => {
    const bytes = await readFile(join(project, file)).catch(() => null)
    return bytes ? (bytes.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length : 0
  }

  log(`${BIN} export (every deck, per step)`)
  let said = null
  try {
    // every page fits (the dense deck's crowded slides too): no overflow said at the end
    const { code, out, err } = await exec('npx', ['--no-install', BIN, 'export'], project)
    if (code !== 0) throw new Error(`exited with ${code}`)
    if (/not fit/.test(err)) fail(`export of every deck: it says a slide does not fit: ${err.slice(err.search(/\n.*not fit/))}`)
    said = out
  } catch (e) {
    fail(`export of every deck: ${e.message}`)
  }
  if (said != null) {
    for (const deck of decks) {
      const file = `exports/${deck.toLowerCase()}.pdf`
      const got = summary(said, file)
      const pages = await pagesIn(file)
      if (!(await pdfAt(file))) fail(`export of every deck: no PDF at ${file}`)
      else if (!got) fail(`export of every deck: no summary line for ${file}`)
      else if (!(pages > 0) || pages !== got.pages || pages !== got.steps) fail(`export of every deck: ${file} has ${pages} pages (its line says ${got.pages}) for ${got.steps} steps`)
      else if (walked[deck] && pages !== walked[deck].steps) fail(`export of every deck: ${file} has ${pages} pages, the walk counted ${walked[deck].steps} steps`)
    }
    const line = said.split('\n').find((l) => l.startsWith(`exports/${venue}.pdf: `))
    if (line && !line.endsWith(`theme ${IMPORTED}`)) fail(`export of every deck: ${venue} is not printed in ${IMPORTED}, its first theme: ${line}`)
    if (!new RegExp(`^${decks.length} of ${decks.length} decks exported, \\d+ pages`, 'm').test(said))
      fail(`export of every deck: no total line for ${decks.length} decks`)
  }

  const one = decks[0]
  log(`${BIN} export --deck ${one} --per-slide`)
  try {
    said = await run('npx', ['--no-install', BIN, 'export', '--deck', one, '--per-slide'], project)
    const file = `exports/${one.toLowerCase()}-slides.pdf`
    const got = summary(said, file)
    const pages = await pagesIn(file)
    if (!(await pdfAt(file))) fail(`export --per-slide: no PDF at ${file}`)
    else if (!got) fail(`export --per-slide: no summary line for ${file}`)
    else if (!(pages > 0) || pages !== got.pages || pages !== got.slides) fail(`export --per-slide: ${file} has ${pages} pages (its line says ${got.pages}) for ${got.slides} slides`)
    else if (walked[one] && pages !== walked[one].slides) fail(`export --per-slide: ${file} has ${pages} pages, the walk counted ${walked[one].slides} slides`)
  } catch (e) {
    fail(`export --per-slide of ${one}: ${e.message}`)
  }

  // --url is the site's base, never a deck's: a deck's own URL gets a warning naming the base it
  // would mean, and then fails on the deck printed (the page says which), as does a URL under
  // which another deck opens (with no warning: its last segment is no deck's); either way exit 1
  // and nothing written. Against vite preview of the build. (A base named like a deck exports
  // with the warning: the CLI's cases, below.)
  const deckName = basename(SECOND[0], '.vue')
  log(`${BIN} export --url <a deck's URL> --deck ${other}`)
  try {
    const base = await serve('preview')
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const printed = new RegExp(`printed the deck "${deckName}", not ${esc(other)}: nothing written`)
    const warned = (url) => new RegExp(`--url ${esc(url)} ends in the name of the deck "${deckName}"\\. If it is that deck's own URL, give the site's base instead, --url ${esc(base)} `)
    const tries = [
      { url: new URL(second, base).href, res: [warned(new URL(second, base).href), printed] },
      { url: new URL(`${second}/x/`, base).href, res: [printed], not: /ends in the name of the deck/ },
    ]
    try {
      for (const t of tries) {
        const { code, err } = await exec('npx', ['--no-install', BIN, 'export', '--url', t.url, '--deck', other, '--out', 'guard/'], project)
        const what = `export --url ${t.url} --deck ${other}`
        if (code !== 1) fail(`${what}: exited with ${code}, not 1`)
        for (const re of t.res) if (!re.test(err)) fail(`${what}: no message matching ${re} on its stderr`)
        if (t.not?.test(err)) fail(`${what}: a message matching ${t.not} on its stderr`)
        const made = await readdir(join(project, 'guard')).catch(() => [])
        if (made.length) fail(`${what}: wrote ${made.join(', ')}`)
      }
    } finally {
      await stop()
    }
  } catch (e) {
    fail(`export --url guard: ${e.message}`)
  }

  // a site under a sub-path: the same project with base '/sub/', built and served by vite
  // preview there, its list, a deck and its export
  log(`a site under /sub/: vite build, vite preview, ${BIN} export`)
  await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'].replace('defineConfig({', "defineConfig({ base: '/sub/',"))
  try {
    await run(process.execPath, [viteBin, 'build'], project)
    await notFoundPage('vite build under /sub/')
    const base = await serve('preview', 'sub/')
    try {
      await selector(base, 'preview (base /sub/)')
      await walk(base, deckName, 'preview (base /sub/)')
    } finally {
      await stop()
    }
    const file = `sub/${second}.pdf`
    const out = await run('npx', ['--no-install', BIN, 'export', '--deck', second, '--out', 'sub/'], project)
    const got = summary(out, file)
    const pages = await pagesIn(file)
    if (!got || !(pages > 0) || pages !== got.pages || (walked[deckName] && pages !== walked[deckName].steps))
      fail(`export under /sub/: ${file} has ${pages} pages (${got ? `its line says ${got.pages}` : 'no summary line'}; the walk counted ${walked[deckName]?.steps} steps)`)
  } catch (e) {
    fail(`a site under /sub/: ${e.message}`)
  } finally {
    await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'])
  }

  // the CLI's other cases: each a decks folder of tiny decks (src/cases/<case>), vite.config.js
  // pointed at it, one export into a folder of its own (--out <case>/). A case with a base is built
  // under it and printed from vite preview there (--url <its base>)
  const cases = [
    { name: 'talks', base: 'talks', args: [],
      files: { 'Talks.vue': tiny('Talks', ['default']), 'Second.vue': tiny('Second', ['default']) },
      code: 0, pdfs: { 'talks.pdf': 3, 'second.pdf': 3 },
      lines: [/^talks\/talks\.pdf: /m, /^2 of 2 decks exported, 6 pages$/m],
      errs: [/--url http:\/\/\S+\/talks\/ ends in the name of the deck "Talks"\. If it is that deck's own URL, give the site's base instead, --url http:\/\/\S+\/ .*if the site's base is named like the deck, nothing to do/] },
    { name: 'theme', args: ['--theme', THEME],
      files: { 'Second.vue': tiny('Second', ['default']), '.Hidden.vue': tiny('Hidden', ['default', THEME]) },
      link: { 'Third.vue': tiny('Third', ['default', THEME]) },
      code: 0, pdfs: { [`third-${THEME}.pdf`]: 3, 'second.pdf': 3 },
      lines: [new RegExp(`^theme/second\\.pdf: .*theme default \\(it does not list ${THEME}`, 'm'), new RegExp(`^theme/third-${THEME}\\.pdf: .*theme ${THEME}$`, 'm'), /^2 of 2 decks exported, 6 pages$/m] },
    { name: 'typo', args: ['--theme', 'nosuch'],
      files: { 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default', THEME]) },
      code: 1, pdfs: {}, errs: [/no deck lists the theme "nosuch"/] },
    { name: 'partial', args: [],
      files: { 'Broken.vue': tiny('Broken', ['default'], THROWS), 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default']) },
      code: 1, pdfs: { 'second.pdf': 3, 'third.pdf': 3 },
      lines: [/^2 of 3 decks exported, 6 pages; failed: Broken$/m], errs: [/Broken: the deck threw before its pages were ready: .*smoke: this deck throws/] },
    { name: 'clash', args: ['--theme', THEME],
      files: { 'Alpha.vue': tiny('Alpha', ['default', THEME]), [`alpha-${THEME}.vue`]: tiny('Not Alpha', ['default']),
        'Beta.vue': tiny('Beta', ['default']), 'beta.vue': tiny('Beta again', ['default']) },
      code: 1, pdfs: { [`alpha-${THEME}.pdf`]: 3, 'beta.pdf': 3 },
      lines: [new RegExp(`^clash/alpha-${THEME}\\.pdf: .*theme ${THEME}$`, 'm'), new RegExp(`^2 of 4 decks exported, 6 pages; failed: alpha-${THEME}, beta$`, 'm')],
      errs: [/differ only in case.*Beta and beta/, new RegExp(`alpha-${THEME}: clash/alpha-${THEME}\\.pdf is Alpha's, written in this run: not overwritten`), /beta: clash\/beta\.pdf is Beta's/] },
    { name: 'imported', args: ['--theme', IMPORTED],
      files: { 'Gamma.vue': tiny('Gamma', ['default', IMPORTED]), 'Second.vue': tiny('Second', ['default']) },
      code: 0, pdfs: { [`gamma-${IMPORTED}.pdf`]: 3, 'second.pdf': 3 },
      lines: [new RegExp(`^imported/gamma-${IMPORTED}\\.pdf: .*theme ${IMPORTED}$`, 'm'), /^2 of 2 decks exported, 6 pages$/m] },
    // the slides that do not fit: listed at the end (the first one's steps 2 and 3, alike, on one
    // line, with the px the dev server's warning said: overflowPx), the usual fix once at the end,
    // the others on their line (fit that cannot shrink a block in px, a paragraph placed past the
    // left); exit 0, the PDF written. The slide that reaches past its box by design is not listed
    { name: 'overflow', args: [],
      files: { [OVERFLOWING[0]]: OVERFLOWING[1] },
      code: 0, pdfs: { 'overflowing.pdf': 6 },
      lines: [/^overflow\/overflowing\.pdf: 6 pages \(4 slides, 6 steps\)/m],
      errs: [/^3 slides do not fit \(a warning: --strict makes it an error\):$/m,
        new RegExp(`^  Overflowing, slide 1 "${OVERFLOW_TITLE}", steps 2-3 of 3: the body overflows by (\\d+)px at the bottom, (under the footer|past the slide's edge \\(cut off\\))$`, 'm'),
        /^  Overflowing, slide 3 "Too wide for fit": the body overflows by \d+px at the right\. Slide\.fit cannot shrink it \(it is sized in px by hand, or transformed\): make it smaller, or fewer blocks$/m,
        /^  Overflowing, slide 4 "Pulled to the left": the body overflows by \d+px at the left\. Past the top or the left it is placed, not pushed .*data-ar-bleed.*$/m,
        /^  To fit it: Slide\.fit \(.*\), a \.scale-90, \.scale-80 or \.scale-70 class on the slide or on a block, or fewer blocks\.$/m],
      notErrs: [/slide 2/, /To fit it[^]*To fit it/],
      px: true },
    // --strict: the same, exit 1, the PDF written all the same
    { name: 'strict', args: ['--strict'],
      files: { [OVERFLOWING[0]]: OVERFLOWING[1] },
      code: 1, pdfs: { 'overflowing.pdf': 6 },
      errs: [/^3 slides do not fit \(--strict: exit 1\):$/m, new RegExp(`^  Overflowing, slide 1 "${OVERFLOW_TITLE}", steps 2-3 of 3: `, 'm')] },
  ]
  try {
    for (const c of cases) {
      log(`${BIN} export ${[...c.args, ...(c.base ? ['--url', `<vite preview>/${c.base}/`] : []), '--out', `${c.name}/`].join(' ')} (${c.name})`)
      const folder = `src/cases/${c.name}`
      await mkdir(join(project, folder), { recursive: true })
      for (const [name, text] of Object.entries(c.files)) await writeFile(join(project, folder, name), text)
      // a deck that is a symlink to a file elsewhere: the app's glob takes it, so must the CLI
      for (const [name, text] of Object.entries(c.link ?? {})) {
        await writeFile(join(project, 'src/cases', name), text)
        await symlink(join(project, 'src/cases', name), join(project, folder, name))
      }
      let config = asIs['vite.config.js'].replace('arao({', `arao({ decks: '${folder}',`)
      if (c.base) config = config.replace('defineConfig({', `defineConfig({ base: '/${c.base}/',`)
      await writeFile(join(project, 'vite.config.js'), config)
      const url = []
      if (c.base) {
        await run(process.execPath, [viteBin, 'build'], project)
        url.push('--url', await serve('preview', `${c.base}/`))
      }
      let said
      try {
        said = await exec('npx', ['--no-install', BIN, 'export', ...c.args, ...url, '--out', `${c.name}/`], project)
      } finally {
        if (c.base) await stop()
      }
      const { code, out, err } = said
      const what = `export (${c.name})`
      if (code !== c.code) fail(`${what}: exited with ${code}, not ${c.code}`)
      for (const [file, want] of Object.entries(c.pdfs)) {
        const pages = await pagesIn(`${c.name}/${file}`)
        if (pages !== want) fail(`${what}: ${c.name}/${file} has ${pages} pages, not ${want}`)
      }
      const made = (await readdir(join(project, c.name)).catch(() => [])).filter((f) => !(f in c.pdfs))
      if (made.length) fail(`${what}: unexpected files in ${c.name}/: ${made.join(', ')}`)
      for (const re of c.lines ?? []) if (!re.test(out)) fail(`${what}: no line matching ${re} in its output`)
      for (const re of c.errs ?? []) if (!re.test(err)) fail(`${what}: no message matching ${re} on its stderr`)
      for (const re of c.notErrs ?? []) if (re.test(err)) fail(`${what}: a message matching ${re} on its stderr`)
      // the export's px are the dev server's: the canvas's, whatever the window
      if (c.px && overflowPx != null && !err.includes(`overflows by ${overflowPx}px`)) fail(`${what}: its overflow is not the ${overflowPx}px the dev server said`)
    }
  } finally {
    await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'])
  }
} catch (e) {
  fail(e.stack ?? String(e))
} finally {
  await cleanup()
}

if (problems.length) {
  console.error(`\n[smoke] ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}
console.log(`\n[smoke] OK: ${PKG} installs, builds, runs its decks clean at their paths (also under a sub-path), lists them with their covers and exports them`)
