// The one place that reads the icons the Vite plugin found in the project (virtual:arao/icons):
// "prefix:name" → { body, width, height }. Used by Icon.
import { shallowRef } from 'vue'
import { icons as found } from 'virtual:arao/icons'

// A name newly used during development brings a new module (the plugin sends it in the same hot
// update as the file that uses it): the map is replaced in place and the Icons re-render. The map
// has no prototype, so a name like "constructor" is just a missing icon.
const icons = shallowRef(found)
if (import.meta.hot) {
  import.meta.hot.accept('virtual:arao/icons', (mod) => {
    if (!mod) return
    warned.clear() // what is still missing is reported again
    icons.value = mod.icons
  })
}

export const NAME = /^[a-z\d]+(?:-[a-z\d]+)*:[a-z\d]+(?:-[a-z\d]+)*$/

export const iconData = (name) => icons.value[name]

// One development warning per missing name, saying what is most likely wrong: no such set
// installed, or a name the build could not read in the source (or a typo).
const warned = new Set()
export function warnMissing(name) {
  if (!import.meta.env.DEV || warned.has(name)) return
  warned.add(name)
  const prefix = name.split(':')[0]
  const force = `a name built at runtime goes in arao({ icons: ['${name}'] })`
  if (!NAME.test(name)) console.warn(`[arao] Icon "${name}" is not an icon name: write prefix:name, as in "lucide:rocket"`)
  else if (Object.keys(icons.value).some((n) => n.startsWith(prefix + ':')))
    console.warn(`[arao] Icon "${name}" not found: check the name in the set (https://icon-sets.iconify.design/${prefix}/); ${force}`)
  else console.warn(`[arao] Icon "${name}" not found: is the set installed? npm install -D @iconify-json/${prefix}; ${force}`)
}

// ids inside an icon (gradients, masks, clip paths) made unique for each drawing: the same icon
// twice in the page would otherwise point both at the first one's, which breaks while that one is
// hidden. References are #id, url(#id) and "id.begin"-style animation timings (Iconify's rewrite).
let drawn = 0
export function uniqueIds(body) {
  if (!body.includes('id=')) return body
  const tag = `ar-icon-${++drawn}`
  const ids = Array.from(body.matchAll(/\sid="([^"]+)"/g), (m) => m[1])
  return ids.reduce((out, id, i) => out.replace(
    new RegExp(`([#;"])(${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([")]|\\.[a-z])`, 'g'),
    `$1${tag}-${i}$3`,
  ), body)
}
