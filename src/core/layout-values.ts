// A layout parameter's value, checked in development: a parameter whose doc block lists what it
// takes ({top|bottom}, {0..1|none}: vite/layout-docs.js) warns when a slide gives it anything
// else, which its layout's CSS would not read as meant (a style query that matches no word, a
// calc() made invalid), with nothing on screen to say so. Once per layout, parameter and value,
// however many slides and views draw it. What each takes comes from the Vite plugin
// (virtual:arao/layout-tokens), the same doc blocks the types are written from; the rest of the
// parameters take any value. Slide.vue calls it as it sets a parameter's token.
import { layoutValues } from 'virtual:arao/layout-tokens'

// a number as CSS writes it: 0, .6, -1.5, 2e3
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
const warned = new Set<string>()

export function checkLayoutParam(layout: string, thing: string, value: string) {
  if (!import.meta.env.DEV) return
  const byThing = Object.hasOwn(layoutValues, layout) ? layoutValues[layout] : undefined
  const spec = byThing && Object.hasOwn(byThing, thing) ? byThing[thing] : undefined
  if (!spec) return
  const text = value.trim()
  const n = NUMBER.test(text) ? Number(text) : NaN
  if (spec.words.includes(text) || spec.ranges.some(([from, to]) => n >= from && n <= to)) return
  const key = `${layout}\n${thing}\n${value}`
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[arao] Slide(layout="${layout}") ${thing}="${value}": it takes ${spec.takes} (its doc block: npx arao layouts)`)
}
