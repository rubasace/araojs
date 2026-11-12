// FLIP for collapsed steps: when a .collapse step appears or disappears, the elements around it
// glide to their new place instead of jumping (First, Last, Invert, Play).
// Only translation is animated (never size, it would distort text); inline boxes cannot move.

// Elements whose position may change when `roots` change display: each root, its ancestors up
// to the slide, and every sibling along that path. Returned in document order, so ancestors
// come before their descendants.
function around(host, roots) {
  const set = new Set()
  for (const root of roots) {
    for (let n = root; n && n !== host && n.parentElement; n = n.parentElement) {
      for (const s of n.parentElement.children) set.add(s)
    }
  }
  return [...set].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}

const box = (el) => (el.getClientRects().length ? el.getBoundingClientRect() : null)

// First: where everything around `roots` is on screen now (mid-glide positions included).
export function snapshot(host, roots) {
  return new Map(around(host, roots).map((el) => [el, box(el)]))
}

function timing(host) {
  const v = getComputedStyle(host).getPropertyValue('--ar-step-duration').trim()
  const ms = v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000
  return { duration: ms >= 0 ? ms : 350, easing: 'ease' }
}

// Apply `change` (which returns the elements it made appear), then Invert and Play: each element
// starts where `first` saw it and glides to its new place; elements that appeared fade in.
// Every position is read before any animation starts: a started animation moves its element's
// descendants at once, so reading after it would see them already displaced.
export function flip(host, first, change) {
  for (const el of first.keys()) el.__phGlide?.cancel() // positions read from here on are final
  const appeared = change()
  // rects are in screen px, translations in canvas px: undo the deck's scale
  const scale = host.getBoundingClientRect().width / host.offsetWidth || 1
  const { duration, easing } = timing(host)

  // Read: total shift of every element that can move (`first` is in document order, so an
  // ancestor is always decided before its descendants)
  const moved = new Map() // element that will glide → its total shift, in screen px
  const glides = []
  for (const [el, a] of first) {
    const b = a && box(el)
    if (!b) continue
    const shift = { x: a.left - b.left, y: a.top - b.top }
    // the nearest gliding ancestor carries this element by its own total shift:
    // only the difference is left to animate
    let x = shift.x, y = shift.y
    for (let p = el.parentElement; p && p !== host; p = p.parentElement) {
      const d = moved.get(p)
      if (d) { x -= d.x; y -= d.y; break }
    }
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue
    if (getComputedStyle(el).display === 'inline') continue // inline boxes cannot be translated
    moved.set(el, shift)
    glides.push([el, x, y])
  }

  // Write: start every glide
  for (const [el, x, y] of glides) {
    el.__phGlide = el.animate(
      [{ translate: `${x / scale}px ${y / scale}px` }, { translate: '0 0' }],
      { duration, easing },
    )
  }
  // what appeared fades in, once the others have started making room for it
  for (const el of appeared) {
    el.__phFade?.cancel()
    el.__phFade = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration, easing, delay: moved.size ? duration / 3 : 0, fill: 'backwards',
    })
  }
}
