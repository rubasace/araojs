// Slide controllers by id, so v-step can find the slide that contains it from the DOM.
export const slides = new Map()
export const DECK = Symbol('phoenyx-deck')
export const SLIDE = Symbol('phoenyx-slide')
// the Deck's #footer slot, for every slide to draw (a function: the slot as it is now, or undefined)
export const FOOTER = Symbol('phoenyx-footer')
