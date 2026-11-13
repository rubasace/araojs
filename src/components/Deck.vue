<!-- The deck: its slides on a fixed canvas, the controls, the keyboard, the URL.
     Two ways to show it, from the same URL:
       audience view    the slides, full window (the default)
       presenter view   ?presenter, or "p" / the controls' button (opens it in a new window):
                        the current slide, a preview of the next step, the speaker notes (Notes),
                        a wall clock and the talk's timer (views/PresenterView.vue)
     "p" brings an open presenter window forward instead of reloading it; if the browser blocks the
     new window, a notice above the controls links to the presenter view to open it by hand.
     The presenter view mounts every slide twice (current + preview): see useDeck().role.
     touch (phones, tablets): tap the right quarter → next, the left quarter → previous, the middle
     → show/hide the controls; swipe left/right → next/previous. Links, buttons and inputs inside a
     slide keep their own taps (add data-ar-touch="ignore" to any other element that needs them).
     Every window of the same deck in the same browser stays in step (core/sync.js): moving in any of
     them moves the others, and so does a theme change; the last move wins. A window that opens
     takes the position of the ones already open (and their theme, unless its URL names one).
     duration="45m" is the talk's length (formats: state/timer.js parseDuration): the presenter view
     counts down to it, and its bar can change it live for every window (the prop stays the
     default; the change wins until reset, even over an edit of the prop that differs from it).
     The timer starts with the first move of the deck, in any window; timer and changed length
     survive reloading the windows (not closing them).
     Export: ?export prints the deck, one page per step (&per-slide: per slide; &notes: a page of
     notes after each slide that has them): views/ExportView.vue and core/exporter.js, and
     npm run export for the PDFs.
     Footer: the #footer slot is drawn at the bottom of every slide except covers and sections
     (each Slide draws it, so it fades, prints and shows in the presenter view with its slide);
     its slot props are { number, total }, the slide's number (1-based) and the slide count:
       template(#footer="{ number, total }")
         span ACME · Conf 2026
         span {{ number }} / {{ total }}
     Thumbnail: inside something that called provideThumbnail() (state/deck.js), the deck is its
     cover, small and still (views/ThumbnailView.vue): useDeck().role is 'thumbnail' there.
     The deck's state is state/deck.js (createDeck); this component only wires it to the view the
     window shows (views/: AudienceView, PresenterView, ExportView or ThumbnailView) and to the
     keys, which the audience and presenter views listen to. -->
<template>
  <ThumbnailView v-if="deck.mode === 'thumbnail'" :deck="deck" :width="width" :height="height">
    <slot />
  </ThumbnailView>
  <ExportView v-else-if="deck.mode === 'export'" :deck="deck" :width="width" :height="height">
    <slot />
  </ExportView>
  <PresenterView v-else-if="deck.mode === 'presenter'" ref="view" :deck="deck" :width="width" :height="height">
    <slot />
  </PresenterView>
  <AudienceView v-else ref="view" :deck="deck" :width="width" :height="height" :hide-cursor-after="hideCursorAfter">
    <slot />
  </AudienceView>
</template>

<script setup>
import { ref, useSlots } from 'vue'
import { createDeck } from '../state/deck'
import { provideFooter } from '../state/slide'
import { useKeyboard } from '../composables/useKeyboard'
import AudienceView from '../views/AudienceView.vue'
import ExportView from '../views/ExportView.vue'
import PresenterView from '../views/PresenterView.vue'
import ThumbnailView from '../views/ThumbnailView.vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  // the themes it can wear, the first by default: 'default' (the engine's tokens) and the names of
  // the project's themes (src/themes); without it, all of them, 'default' first (state/deck.js)
  themes: Array,
  // hide the mouse cursor after this many ms without moving it (0 = never)
  hideCursorAfter: { type: Number, default: 5000 },
  // the talk's length, for the presenter view's countdown: 90 or "90" (minutes), "45m", "1h30m",
  // "1h30", "90s", "45:00" (m:ss), "1:30:00" (h:mm:ss). Anything else warns and counts nothing;
  // a length outside 1 min – 24 h warns and counts.
  duration: [String, Number],
})

// the #footer slot, read when each slide renders (the slots object is updated in place)
const slots = useSlots()
provideFooter(() => slots.footer)

const deck = createDeck(props)

// the keys, in the audience and presenter views; the view opens and closes the jump menu
const view = ref()
if (deck.mode === 'audience' || deck.mode === 'presenter') {
  const { stage } = deck
  useKeyboard({
    next: stage.next,
    prev: stage.prev,
    first: () => stage.go(0),
    last: stage.last,
    fullscreen: deck.face.toggleFullscreen,
    theme: deck.cycleTheme,
    presenter: deck.mode === 'presenter' ? null : deck.face.openPresenter,
    menu: () => view.value.toggleMenu(),
    jump: (digit) => view.value.openMenu(digit),
    close: () => view.value.closeMenu(),
  })
}
</script>
