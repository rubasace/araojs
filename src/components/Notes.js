import { onBeforeUnmount, shallowReactive, watchEffect } from 'vue'
import { useSlideNotes } from '../state/slide'

// Speaker notes, placed anywhere inside a Slide. Never drawn on the slide: it takes no room, adds
// no step and no title. The presenter view (?presenter, or "p") shows them, rendered as written.
//   Slide
//     h2 Pricing
//     p(v-step="2") Three tiers
//     Notes
//       p Start with the story of the first customer.
//     Notes(step="2")
//       p Tiers: say why there is no free plan.
// step="n": the notes show from step n of the slide on (as v-step="n"), and the presenter view
// marks the ones that start at the step on screen. Without step they show from the start.
// A slide may have several; they show in the order they were mounted (the order they are written,
// unless a v-if brings one in later: it goes last).
// The content is markup, not part of the slide: v-step and useSlide() do not work inside it.
// Elsewhere (the presenter view, the export's notes pages) NoteBody(:note="n") renders one.
const isStep = (v) => Number.isInteger(Number(v)) && Number(v) >= 1
let uid = 0

export const Notes = {
  name: 'Notes',
  inheritAttrs: false,
  props: {
    step: { type: [Number, String], default: 1, validator: isStep },
  },
  setup(props, { slots }) {
    const addNote = useSlideNotes()
    if (!addNote) {
      console.warn('[arao] Notes used outside a <Slide>: they show nowhere')
      return () => null
    }
    // the slots object, not its function: a re-render of the deck replaces the function in place
    const note = shallowReactive({ id: ++uid, step: 1, slots })
    watchEffect(() => (note.step = isStep(props.step) ? Number(props.step) : 1))
    onBeforeUnmount(addNote(note))
    return () => null
  },
}

// A note's content is its slot, rendered wherever it is shown, far from the slide it was written in.
export const NoteBody = (p) => p.note.slots.default?.()
NoteBody.props = ['note']
