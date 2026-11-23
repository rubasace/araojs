// A layout's design values come from the design system: its colours and its sizes are tokens
// (the theme's, src/styles/tokens.css: var(--ar-…)), or derived from them, never written as they
// look. So a theme that changes its tokens changes every layout with it, and a layout written for
// one theme suits them all. This reads every declaration of a layout's CSS file (its code: not in
// a comment or a string), whatever it declares: a parameter's default, a private --_ar-… it
// resolves, a property of any rule, in a block of any depth (@container, nested rules). What one
// writes as a literal is a problem:
//   - a colour: #rgb, #rrggbb (and their alpha forms), a colour function (rgb(), rgba(), hsl(),
//     hsla(), hwb(), lab(), lch(), oklab(), oklch(), color()) of literal channels, a named colour
//     (white, black, red…) or a system one (Canvas, CanvasText…); inside a gradient or a var()'s
//     fallback alike. A colour is var(--ar-…), or currentColor, transparent, inherit; color-mix()
//     over those is one too (color-mix(in srgb, var(--ar-scrim) 60%, transparent)), and so is a
//     colour function that derives its colour from another (rgb(from var(--ar-x) r g b / .5)) or
//     whose channels are tokens: its arguments var()s and nothing else but numbers, percentages,
//     /, commas, none (and calc(), min(), max(), clamp() of those; color()'s colour space), one
//     var() at least (rgb(var(--x-rgb) / .5), hsl(var(--h) 50% 50%)). What such a function holds
//     is read like the rest (a var()'s fallback, the colour rgb(from …) starts from);
//   - a length in an absolute unit (px, pt, pc, cm, mm, q, in), or in one that is the page's and
//     no token's (rem, rlh: the root's font; vw, vh, vmin, vmax, vi, vb and their s-, l- and d-
//     forms: the window, not the canvas); but zero (0px is 0). A length is a token, or relative to
//     one or to the box: calc(var(--ar-…) * n), em (and ex, ch, cap, ic, lh), %, fr, the
//     container's cq* units. A 1px hairline is no exception: a token, the layout's or the
//     theme's, gives it.
// What is not a colour or a length is as written: keywords (none, center, auto…), numbers without
// a unit (an opacity, a strength, a weight, a count, a line height), fr track lists, strings
// (a quote's mark), durations and angles. A var()'s fallback is read like the rest: one that is a
// token (var(--ar-layout-x-bar, var(--ar-accent))) is fine, one that is a literal (…, #fff) is not.
// What a url() holds, a counter() or counters() (a counter's name, its style), and a grid line's
// [name], are names, not values. Font families, animation, counter, container, page and anchor
// names, grid areas and the properties a transition names take names too: a word that is a
// colour's is no colour in them. A mask is a colour all the same (mask: linear-gradient(black,
// transparent) is a literal): a mask reads only alpha, so currentColor does it.
// Selectors and at-rules' preludes (@media (min-width: …), @container …) are no declarations, and
// are not read.
// The design system itself (tokens.css, a theme) is where literals are written, and is not read
// here; nor is the engine's own CSS (a component's, Slide.vue's default layout).
// layout-docs.js adds what this finds to a layout's problems: the library's build stops on its own
// (scripts/layout-types.mjs), the Vite plugin warns about a project's, and arao layouts lists them.
import { scanCss } from './layout-params.js'

// the named colours of CSS (currentColor and transparent aside: those are allowed) and its system
// colours, lower case
const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet '
  + 'brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan '
  + 'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred '
  + 'darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue '
  + 'dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray '
  + 'green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen '
  + 'lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink '
  + 'lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen '
  + 'linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue '
  + 'mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy '
  + 'oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip '
  + 'peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown '
  + 'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal '
  + 'thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen '
  + 'accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext '
  + 'graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext').split(' '))
// the functions that make a colour of their arguments
const COLOR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'])
// the units of a length no token gives: absolute, or the page's (its root's font, the window)
const FIXED_UNITS = new Set(['px', 'pt', 'pc', 'cm', 'mm', 'q', 'in', 'rem', 'rlh',
  ...['vw', 'vh', 'vmin', 'vmax', 'vi', 'vb'].flatMap((u) => [u, `s${u}`, `l${u}`, `d${u}`])])
// the properties whose words are names (a font's, an animation's…): a colour's name is none there
const NAMES = /^(?:font|font-family|animation|animation-name|transition|transition-property|will-change|container|container-name|counter-(?:reset|increment|set)|view-transition-name|grid-area|grid-(?:row|column)(?:-start|-end)?|grid-template-areas|anchor-name|position-anchor|page)$/i
// the functions whose arguments are names: a url's text, a counter's name and its style
const NAME_FUNCTIONS = new Set(['url', 'counter', 'counters'])
// a colour function's arguments that are tokens' channels (see the top): with the var()s and the
// colour space of color() taken out, and calc(), min(), max() and clamp() opened, nothing but
// numbers (a percentage too), /, commas, operators, parentheses and none
const CHANNELS = /^(?:\s|[(),/*+-]|none\b|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?(?![\d.]))*$/i
const COLOR_SPACE = /^\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\b/i

// a declaration: a property (a custom one too), a colon, its value
const DECLARATION = /^\s*(--[\w-]+|-?[A-Za-z_][\w-]*)\s*:([\s\S]*)$/
// a value's tokens, left to right: a word (a function's name when a ( follows it), a hash, or a
// number with its unit
const TOKEN = /(--[\w-]+|-?[A-Za-z_][\w-]*)(\()?|#([\w-]+)|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([A-Za-z]+|%)?/g
const HEX = /^(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/

/**
 * The declarations of a stylesheet's code (comments and strings blanked in place: scanCss's
 * masked), each with its property, its value and the offset where it starts: what is written
 * between a block's {, a ; or a } and the next ; or } (in parentheses or not: a ; inside a url( … )
 * ends nothing), when it is a property and a colon. A rule's selector, an at-rule's prelude (what
 * comes before a {) and a statement outside every block (@import …;) are none.
 * @param {string} masked
 * @returns {{ property: string, value: string, at: number }[]}
 */
function declarations(masked) {
  /** @type {{ property: string, value: string, at: number }[]} */
  const out = []
  let depth = 0 // of blocks
  let parens = 0
  let from = 0
  for (let i = 0; i <= masked.length; i++) {
    const c = masked[i]
    if (c === '(') parens++
    else if (c === ')') parens = Math.max(0, parens - 1)
    if (parens && i < masked.length) continue
    if (c === '{' || c === ';' || c === '}' || i === masked.length) {
      if (depth > 0 && c !== '{') {
        const m = masked.slice(from, i).match(DECLARATION)
        if (m) out.push({ property: m[1], value: m[2], at: from + (masked.slice(from, i).match(/^\s*/)?.[0].length ?? 0) })
      }
      if (c === '{') depth++
      else if (c === '}') depth = Math.max(0, depth - 1)
      from = i + 1
    }
  }
  return out
}

/**
 * Where the parenthesis that closes the one at open is in a text (its end, when none does).
 * @param {string} text
 * @param {number} open
 */
function closing(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return i
  }
  return text.length
}

/**
 * Whether a colour function's arguments are tokens' channels (CHANNELS: var()s, one at least, and
 * nothing but numbers, percentages, /, commas and none besides).
 * @param {string} name the function's, lower case
 * @param {string} args
 */
function tokenChannels(name, args) {
  let rest = name === 'color' ? args.replace(COLOR_SPACE, ' ') : args
  let vars = 0
  for (let at = rest.search(/\bvar\(/i); at >= 0; at = rest.search(/\bvar\(/i), vars++) {
    rest = `${rest.slice(0, at)} ${rest.slice(closing(rest, at + 3) + 1)}`
  }
  return vars > 0 && CHANNELS.test(rest.replace(/\b(?:calc|min|max|clamp)\(/gi, '('))
}

/**
 * A value's literal colours and lengths (see the top), each as written (a long call shortened),
 * once each.
 * @param {string} property
 * @param {string} value
 * @returns {{ colours: string[], lengths: string[] }}
 */
function literals(property, value) {
  /** @type {Set<string>} */
  const colours = new Set()
  /** @type {Set<string>} */
  const lengths = new Set()
  const v = value.replace(/!\s*important\s*$/i, '')
  const names = NAMES.test(property)
  TOKEN.lastIndex = 0
  for (let m = TOKEN.exec(v); m; m = TOKEN.exec(v)) {
    const [whole, word, call, hash, number, unit] = m
    if (word != null) {
      const name = word.toLowerCase()
      if (call && NAME_FUNCTIONS.has(name)) {
        TOKEN.lastIndex = closing(v, m.index + word.length) + 1 // names, no values
      } else if (call && COLOR_FUNCTIONS.has(name)) {
        const end = closing(v, m.index + word.length)
        const args = v.slice(m.index + word.length + 1, end)
        // a colour of another, or of tokens' channels: what it holds is read on
        if (!/^\s*from\b/i.test(args) && !tokenChannels(name, args)) {
          const text = v.slice(m.index, end + 1).replace(/\s+/g, ' ')
          colours.add(text.length > 32 ? `${word}(…)` : text)
          TOKEN.lastIndex = end + 1
        }
      } else if (!call && !names && !word.startsWith('--') && NAMED.has(name)) colours.add(word)
    } else if (hash != null) {
      if (HEX.test(hash)) colours.add(whole)
    } else if (number != null && unit && FIXED_UNITS.has(unit.toLowerCase()) && Number(number) !== 0) lengths.add(whole)
  }
  return { colours: [...colours], lengths: [...lengths] }
}

// a grid line's [name] is a name: blanked, as a url's and a counter's arguments are skipped
const LINE_NAMES = /\[[^\]]*\]/g

/**
 * What a layout's CSS writes as a literal (see the top): each declaration that does, its line, its
 * property, and its literal colours and lengths, each as written, once each.
 * @param {string} css
 * @returns {{ line: number, property: string, colours: string[], lengths: string[] }[]}
 */
export function literalFindings(css) {
  const { masked } = scanCss(css)
  /** @type {{ line: number, property: string, colours: string[], lengths: string[] }[]} */
  const found = []
  for (const { property, value, at } of declarations(masked)) {
    const { colours, lengths } = literals(property, value.replace(LINE_NAMES, (s) => ' '.repeat(s.length)))
    if (colours.length || lengths.length) found.push({ line: masked.slice(0, at).split('\n').length, property, colours, lengths })
  }
  return found
}

/**
 * The problems of a layout's CSS: each declaration that writes a colour or a length as a literal
 * (literalFindings), at its line; one for its colours, one for its lengths.
 * @param {string} css
 * @returns {string[]}
 */
export function literalProblems(css) {
  /** @type {string[]} */
  const problems = []
  const list = (/** @type {string[]} */ xs) => xs.join(', ')
  for (const { line, property, colours, lengths } of literalFindings(css)) {
    if (colours.length) {
      problems.push(`line ${line}, ${property}: ${list(colours)} ${colours.length > 1 ? 'are literal colours' : 'is a literal colour'}; `
        + "a layout's colours are the design tokens: var(--ar-…), or currentColor, transparent, inherit (color-mix() over them too)")
    }
    if (lengths.length) {
      problems.push(`line ${line}, ${property}: ${list(lengths)} ${lengths.length > 1 ? 'are fixed lengths' : 'is a fixed length'}; `
        + "a layout's sizes are the design tokens or relative to them: var(--ar-…), calc(var(--ar-…) * n), em, %, fr")
    }
  }
  return problems
}
