<!-- The presenter view's top bar: where the deck is, the talk's timer, the wall clock. It ticks on
     its own (four times a second), so the rest of the presenter view does not re-render with it.
     Where the deck is comes from useDeck(); the timer and the talk's length, with what changes
     them (play/pause, reset, the length for every window of the deck), from useTimer()
     (state/timer.ts); the presenter view passes the title of the slide on screen.
     The length's button opens an editor: the same formats as Deck(duration), from 1 minute to 24
     hours; Enter applies, Escape, a click elsewhere or the focus leaving it cancels. While the
     focus is in it, no key of the deck acts. Closed from inside, it leaves the focus next to the
     button, not on it, so Space and Enter move the slides again (below, close()). -->
<template>
  <header class="ar-p-bar" :lang="lang">
    <div class="ar-p-where">
      <span class="ar-p-count">{{ deck.index.value + 1 }}<span class="ar-p-of"> / {{ deck.total.value }}</span></span>
      <span class="ar-p-title" :title="title" :lang="deckLang">{{ title }}</span>
    </div>
    <div class="ar-p-timer" :class="[timer.state, tone]">
      <div class="ar-p-times">
        <span class="ar-p-elapsed" :title="t('elapsed')">{{ clock(spent) }}</span>
        <span class="ar-p-sub" v-if="sub">{{ sub }}</span>
      </div>
      <button
        class="ar-p-btn"
        @mousedown.prevent
        @click="toggle"
        :title="t(timer.state === 'running' ? 'pauseTimer' : timer.state === 'paused' ? 'resumeTimer' : 'startTimer')"
      >
        <svg v-if="timer.state === 'running'" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" /></svg>
        <svg v-else viewBox="0 0 24 24"><path class="fill" d="M8 5.5v13l10.5-6.5z" /></svg>
      </button>
      <button
        class="ar-p-btn"
        @mousedown.prevent
        @click="resetTimer"
        :disabled="timer.state === 'idle'"
        :title="t('resetTimer')"
      >
        <svg viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" /></svg>
      </button>
      <!-- where the focus rests when the editor closes from inside it: not a button, so Space
           and Enter go back to the slides, and Tab reaches the length's button again -->
      <div ref="group" class="ar-p-length" role="group" :aria-label="t('talkLength')" tabindex="-1">
        <button
          ref="trigger"
          class="ar-p-btn ar-p-dur"
          :class="{ changed }"
          @mousedown.prevent
          @click="editing ? cancel() : edit()"
          :aria-label="durationLabel"
          :title="durationLabel"
          aria-haspopup="dialog"
          :aria-expanded="editing"
          :aria-controls="editing ? ids.editor : undefined"
        >
          <svg viewBox="0 0 24 24"><path d="M6.5 3h11M6.5 21h11M8 3c0 4.5 4 5 4 9s-4 4.5-4 9M16 3c0 4.5-4 5-4 9s4 4.5 4 9" /></svg>
          <span>{{ duration ? clock(duration) : t('lengthButton') }}</span>
        </button>
        <!-- data-ar-own-keys: no key of the deck acts while the focus is anywhere in it;
             tabindex -1: a click on its padding keeps the focus in it (else the group takes it) -->
        <form
          v-if="editing"
          ref="editor"
          :id="ids.editor"
          class="ar-p-edit"
          role="dialog"
          :aria-labelledby="ids.label"
          tabindex="-1"
          data-ar-own-keys
          @submit.prevent="apply"
          @keydown.esc.prevent="cancel"
          @focusout="leaving"
        >
          <label :id="ids.label" :for="ids.input">{{ t('talkLength') }}</label>
          <div class="ar-p-edit-row">
            <input
              ref="input"
              :id="ids.input"
              v-model="text"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="45m"
              :aria-invalid="!!error"
              :aria-describedby="`${ids.msg} ${ids.note}`"
              @input="typing"
            />
            <button class="ar-p-edit-btn ar-p-apply" type="submit">{{ t('apply') }}</button>
          </div>
          <p :id="ids.msg" class="ar-p-edit-msg" :class="{ bad: error }" aria-live="polite">
            {{ error || t('lengthHint') }}
          </p>
          <p :id="ids.note" class="ar-p-edit-note" aria-live="polite">{{ notice }}</p>
          <button v-if="changed" class="ar-p-edit-btn ar-p-reset" type="button" @click="reset">
            {{ deckDuration ? t('backToDeckLength', clock(deckDuration)) : t('removeCountdown') }}
          </button>
        </form>
      </div>
    </div>
    <time class="ar-p-clock" :title="t('clock')">{{ wall }}</time>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { MIN_DURATION, clock, elapsed, parseDuration, phase, withinBounds } from '../../state/timer'
import { useDeck } from '../../state/deck'
import { useTimer } from '../../state/timer'
import { lang, t } from '../../i18n/i18n'

const props = defineProps({
  title: { type: String, default: '' },
})
const deck = useDeck()
// the slide's title is the deck's: in the page's language, not the bar's
const deckLang = document.documentElement.lang
const { timer, duration, deckDuration, setDuration, toggle, reset: resetTimer } = useTimer()

const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 250) })
onBeforeUnmount(() => clearInterval(tick))
// a timer that starts or resumes now is read against now, not against the last tick
watch(timer, () => { now.value = Date.now() })

// whole seconds, as shown: the time left is what the shown time leaves (45:00 = 44:59 + 0:01)
const spent = computed(() => Math.floor(elapsed(timer.value, now.value) / 1000) * 1000)
const left = computed(() => (duration.value ? duration.value - spent.value : null))
const tone = computed(() => (duration.value && left.value != null ? phase(left.value, duration.value) : 'ok'))
const sub = computed(() => {
  const state = timer.value.state === 'running' ? undefined : { idle: t('timerIdle'), paused: t('timerPaused') }[timer.value.state]
  const rest = left.value == null ? '' : t(left.value >= 0 ? 'timeLeft' : 'timeOver', clock(left.value))
  return [state, rest].filter(Boolean).join(' · ')
})
const wall = computed(() => new Date(now.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

// ---- the talk's length, edited here --------------------------------------------------------
// changed: set here (in this window or another), not the deck's own
const changed = computed(() => duration.value !== deckDuration.value)
const durationLabel = computed(() => {
  const d = duration.value
  if (!d) return t('setLength')
  if (!changed.value) return t('lengthIs', clock(d))
  return t('lengthChanged', clock(d), deckDuration.value ? t('deckLength', clock(deckDuration.value)) : t('deckNoLength'))
})
const id = useId()
const ids = { editor: `${id}-editor`, label: `${id}-label`, input: `${id}-input`, msg: `${id}-msg`, note: `${id}-note` }
const editing = ref(false)
const text = ref('')
const error = ref('')
const notice = ref('') // the length changed elsewhere while the editor was open
let typed = false // something was typed in the field since it opened
const group = ref<HTMLElement>()
const trigger = ref<HTMLElement>()
const editor = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const shown = (ms: number | null) => (ms ? clock(ms) : '')

async function edit() {
  text.value = shown(duration.value)
  typed = false
  error.value = notice.value = ''
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}
function typing() {
  typed = true
  error.value = ''
}
// Closing from inside (Enter, Esc, the reset, the button again) leaves the focus on the group
// around the button, not on the button: there Space and Enter are the deck's again (a focused
// button keeps them, and would reopen the editor instead of moving the slides), and the next Tab
// reaches the button. Closing because the focus left (focusout) or a press elsewhere leaves the
// focus where it went.
function close(refocus: boolean) {
  editing.value = false
  if (refocus) group.value?.focus({ preventScroll: true })
}
function apply() {
  const typedText = text.value.trim()
  const ms = parseDuration(typedText)
  if (ms == null || !withinBounds(ms)) {
    error.value = !typedText ? t('lengthEmpty')
      : t(ms == null ? 'lengthInvalid' : ms < MIN_DURATION ? 'lengthTooShort' : 'lengthTooLong', typedText)
    input.value?.focus()
    return
  }
  setDuration(ms)
  close(true)
}
function reset() {
  setDuration(null)
  close(true)
}
const cancel = () => close(true)
// The focus left the editor (Tab past its last button, Shift+Tab to the length's button, a click
// on something focusable): that cancels. The window losing the focus (another window or app)
// does not: the focus comes back to the field with it. Read once the focus has landed.
function leaving(e: FocusEvent) {
  if (editor.value?.contains(e.relatedTarget as Node | null)) return
  setTimeout(() => {
    if (editing.value && document.hasFocus() && !editor.value?.contains(document.activeElement)) close(false)
  })
}
// a press anywhere else cancels, a button that takes no focus included (the button toggles it on
// its own)
useEventListener(document, 'pointerdown', (e: PointerEvent) => {
  const target = e.target as Node | null
  if (editing.value && !editor.value?.contains(target) && !trigger.value?.contains(target)) close(false)
}, true)
// The length changed elsewhere (another window, an edit of the deck) while the editor is open:
// the field follows it if nothing was typed in it, typed text stays; either way a notice says
// so, so that Enter never overwrites the new value unknowingly.
watch(duration, (ms) => {
  if (!editing.value) return
  notice.value = ms ? t('lengthNowIs', clock(ms)) : t('lengthNowNone')
  if (typed) return
  text.value = shown(ms)
  error.value = ''
  if (document.activeElement === input.value) nextTick(() => input.value?.select())
})
</script>

<style>
.ar-p-bar {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 24px;
  padding: 12px 24px; background: var(--ar-presenter-bar); border-bottom: 1px solid var(--ar-presenter-line);
  font-variant-numeric: tabular-nums;
}
.ar-p-where { display: flex; align-items: baseline; gap: 14px; min-width: 0; }
.ar-p-count { font-size: calc(var(--ar-ui-text) * 1.75); font-weight: 700; white-space: nowrap; }
.ar-p-of { color: var(--ar-presenter-dim); font-weight: 500; }
.ar-p-title {
  color: var(--ar-presenter-dim); font-size: calc(var(--ar-ui-text) * 1.125);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.ar-p-timer { position: relative; display: flex; align-items: center; gap: 6px; }
.ar-p-times { display: flex; flex-direction: column; align-items: center; min-width: 168px; margin-right: 6px; }
.ar-p-elapsed { font-size: calc(var(--ar-ui-text) * 2.5); font-weight: 700; line-height: 1.1; }
.ar-p-sub { font-size: calc(var(--ar-ui-text) * .875); color: var(--ar-presenter-dim); white-space: nowrap; }
.ar-p-timer.idle .ar-p-elapsed, .ar-p-timer.paused .ar-p-elapsed { color: var(--ar-presenter-dim); }
.ar-p-timer.low :is(.ar-p-elapsed, .ar-p-sub) { color: var(--ar-presenter-low); }
.ar-p-timer.over :is(.ar-p-elapsed, .ar-p-sub) { color: var(--ar-presenter-over); }

.ar-p-btn {
  display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
  border: 1px solid var(--ar-presenter-line); border-radius: var(--ar-presenter-radius);
  background: var(--ar-presenter-panel); color: inherit;
  cursor: pointer; transition: background var(--ar-ui-duration-fast), opacity var(--ar-ui-duration-fast);
}
.ar-p-btn:hover:not(:disabled) { background: var(--ar-presenter-hover); }
.ar-p-btn:focus-visible { outline: 2px solid var(--ar-presenter-accent); outline-offset: 2px; }
.ar-p-btn:disabled { opacity: .35; cursor: default; }
.ar-p-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ar-p-btn svg .fill { fill: currentColor; stroke: none; }

/* the talk's length: its group (where the focus rests once the editor closes: no ring, it is
   not a control, Tab goes on to the button), its button (the accent while it is not the deck's)
   and its editor */
.ar-p-length { display: flex; }
.ar-p-length:focus, .ar-p-edit:focus { outline: none; }
.ar-p-dur {
  grid-auto-flow: column; gap: 8px; width: auto; padding: 0 12px;
  font: inherit; font-size: var(--ar-ui-text); font-weight: 600;
}
.ar-p-dur.changed { color: var(--ar-presenter-accent); }
.ar-p-edit {
  position: absolute; top: calc(100% + 12px); left: 50%; z-index: 200; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 10px; width: 340px; padding: 14px 16px 16px;
  background: var(--ar-presenter-panel); border: 1px solid var(--ar-presenter-line);
  border-radius: calc(var(--ar-presenter-radius) * 1.2);
  box-shadow: var(--ar-presenter-shadow);
}
.ar-p-edit label {
  font-size: calc(var(--ar-ui-text) * .8125); font-weight: 650; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ar-presenter-dim);
}
.ar-p-edit-row { display: flex; gap: 8px; }
.ar-p-edit input {
  flex: 1; min-width: 0; height: 40px; padding: 0 12px;
  border: 1px solid var(--ar-presenter-line); border-radius: calc(var(--ar-presenter-radius) * .8);
  background: var(--ar-presenter-bg); color: var(--ar-presenter-fg);
  font: inherit; font-size: calc(var(--ar-ui-text) * 1.125); font-variant-numeric: tabular-nums;
}
.ar-p-edit input[aria-invalid="true"] { border-color: var(--ar-presenter-over); }
.ar-p-edit-btn {
  height: 40px; padding: 0 14px; border: 1px solid var(--ar-presenter-line); border-radius: calc(var(--ar-presenter-radius) * .8);
  background: var(--ar-presenter-bg); color: inherit; font: inherit; font-size: calc(var(--ar-ui-text) * .9375); cursor: pointer;
}
.ar-p-edit-btn:hover { border-color: var(--ar-presenter-dim); }
.ar-p-apply {
  background: var(--ar-presenter-accent); border-color: var(--ar-presenter-accent); color: var(--ar-presenter-bg);
  font-weight: 650;
}
.ar-p-reset { align-self: stretch; }
.ar-p-edit :is(input, .ar-p-edit-btn):focus-visible { outline: 2px solid var(--ar-presenter-accent); outline-offset: 2px; }
.ar-p-edit-msg { margin: 0; font-size: calc(var(--ar-ui-text) * .8125); line-height: 1.4; color: var(--ar-presenter-dim); }
.ar-p-edit-msg.bad { color: var(--ar-presenter-over); }
.ar-p-edit-note { margin: 0; font-size: calc(var(--ar-ui-text) * .8125); line-height: 1.4; color: var(--ar-presenter-low); }
.ar-p-edit-note:empty { display: none; }

.ar-p-clock { justify-self: end; font-size: calc(var(--ar-ui-text) * 2.5); font-weight: 700; white-space: nowrap; }

@media (max-width: 900px) {
  .ar-p-bar { gap: 12px; padding: 10px 16px; }
  .ar-p-elapsed, .ar-p-clock { font-size: calc(var(--ar-ui-text) * 1.75); }
  .ar-p-count { font-size: calc(var(--ar-ui-text) * 1.375); }
  .ar-p-title { display: none; }
  .ar-p-times { min-width: 0; }
}
</style>
