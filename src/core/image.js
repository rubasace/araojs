// Helpers shared by Img and Slide, and the one place that reads the images folder.
import { shallowRef } from 'vue'
import { images as folder, imagesDir } from 'virtual:arao/images'

export { imagesDir }

// The images folder: file path inside it → URL. A picture added to (or removed from) the folder
// during development replaces the map here, in place: the Imgs and the slides whose bg names a
// file re-render, and nothing remounts. The map has no prototype, so a name like "constructor"
// is just a missing file.
const images = shallowRef(folder)
if (import.meta.hot) {
  import.meta.hot.accept('virtual:arao/images', (mod) => {
    if (!mod) return
    warned.clear() // what is missing now (again) is reported again
    images.value = mod.images
  })
}

// The URL of a file in the images folder, or undefined. "./team.jpg" is "team.jpg"; a query or
// hash ("team.jpg?v=2") is ignored when the name without it is a file. Names are case-sensitive.
export function fileUrl(name) {
  const path = name?.trim().replace(/^\.?\/+/, '')
  if (!path) return undefined
  return images.value[path] ?? images.value[path.split(/[?#]/)[0]]
}

// A root-relative URL ("/logo.svg", a file in public/) is served under the app's base: with
// base "/talk/" it is "/talk/logo.svg". Protocol-relative (//cdn…) and scheme URLs, and paths
// that already start with the base, are left as they are.
export function withBase(url, base = import.meta.env.BASE_URL) {
  if (!url || url[0] !== '/' || url[1] === '/' || !base || base === '/' || url.startsWith(base)) return url
  return base.replace(/\/$/, '') + url
}

// Slide(bg="…") is one of three things, tried in this order:
//   'url'   starts with a scheme or a slash: https://…, data:…, //cdn…, /from-public.jpg
//   'file'  a file in the images folder, whatever its name ("photo (1).jpg", "a.jpg?v=2"); or
//           a name that looks like a file (ends in an extension, no parentheses or commas) but is
//           not there yet: it shows as missing, with a warning
//   'css'   anything else is a CSS background: a colour, a gradient, url(…) (#123, linear-gradient(…))
// Blank is no bg at all (null).
const URL_LIKE = /^(?:[a-z][a-z\d+.-]*:|\/)/i
const FILE_LIKE = /^[^()'",;]+\.[a-z][a-z\d]{1,4}$/i
export function bgKind(value) {
  const v = value?.trim()
  if (!v) return null
  if (URL_LIKE.test(v)) return 'url'
  if (fileUrl(v) || FILE_LIKE.test(v.split(/[?#]/)[0])) return 'file'
  return 'css'
}

// opacity: a number from 0 to 1 ("0.5", .5); undefined when absent or invalid
export const opacityValue = (v) => {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return n >= 0 && n <= 1 ? n : undefined
}
export const isOpacity = (v) => opacityValue(v) !== undefined

// blur: px, as a number (4) or a px length ("4px"); 0 when absent or invalid
export const isBlur = (v) => /^\d*\.?\d+(px)?$/.test(String(v).trim())
export const blurValue = (v) => (v != null && isBlur(v) ? parseFloat(v) : 0)

// A blurred box spreads its edge inward, fading into what is behind it; grown by twice the
// radius on every side (and clipped by its container) the soft edge falls outside the view.
export const blurStyle = (px, replaced = false) => (px > 0 ? {
  filter: `blur(${px}px)`,
  inset: `${-2 * px}px`,
  // an <img> does not stretch between its insets: it needs the size spelled out
  ...(replaced && { width: `calc(100% + ${4 * px}px)`, height: `calc(100% + ${4 * px}px)` }),
} : {})

// Development warnings, one per name, gathered into a single line per batch: a deck whose
// pictures are not in the repo (yet) gets one warning listing them, not one per slide. A change
// to the images folder starts over, so a file that comes back missing is reported again.
const warned = new Set()
const batches = new Map() // message → names
export function warnOnce(message, name) {
  if (!import.meta.env.DEV || warned.has(message + name)) return
  warned.add(message + name)
  if (!batches.size) {
    setTimeout(() => {
      for (const [msg, names] of batches) console.warn(`[arao] Img: ${msg} (${names.length}): ${names.join(', ')}`)
      batches.clear()
    })
  }
  batches.set(message, [...(batches.get(message) || []), name])
}
