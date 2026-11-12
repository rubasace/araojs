// Helpers shared by Img and Slide. Nothing here imports the images folder, so adding a picture
// to it reloads only the Img components, never the slides.

// Slide(bg="…") is one of three things, told apart by its shape:
//   'url'   starts with a scheme or a slash: https://…, data:…, //cdn…, /from-public.jpg
//   'file'  a name ending in an extension, without parentheses or commas: city.jpg, team/ana.png
//   'css'   anything else is a CSS background: a colour or a gradient (#123, linear-gradient(…))
const URL_LIKE = /^(?:[a-z][a-z\d+.-]*:|\/)/i
const FILE_LIKE = /^[^()'",;]+\.[a-z][a-z\d]{1,4}$/i
export function bgKind(value) {
  const v = value?.trim()
  if (!v) return null
  if (URL_LIKE.test(v)) return 'url'
  if (FILE_LIKE.test(v)) return 'file'
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
// pictures are not in the repo (yet) gets one warning listing them, not one per slide.
const warned = new Set()
const batches = new Map() // message → names
export function warnOnce(message, name) {
  if (!import.meta.env.DEV || warned.has(message + name)) return
  warned.add(message + name)
  if (!batches.size) {
    setTimeout(() => {
      for (const [msg, names] of batches) console.warn(`[phoenyx] Img: ${msg} (${names.length}): ${names.join(', ')}`)
      batches.clear()
    })
  }
  batches.set(message, [...(batches.get(message) || []), name])
}
