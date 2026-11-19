// A TypeScript project using araojs: what its types must allow, and what they must reject. Each
// public export has an @ts-expect-error: if its type became `any`, the directive would be unused
// and the check would fail.
import Arao, {
  createDeckApp, useDeck, useSlide, step, stepFrom,
  Deck, Slide, Background, Img, Icon, Snippet, Notes, Cols, Rows, Grid, Center, ProgressBar, SlideNumber,
  type DeckFace, type DeckAppOptions, type SlideControls, type SlideLayouts, type ProjectLayouts, type Role, type Timer,
} from 'araojs'
import arao, { arao as namedArao, type AraoOptions } from 'araojs/vite'

// the Vite plugin, default and named
const options: AraoOptions = { decks: 'src/decks', themes: ['src/themes', 'arao-themes'], layouts: 'src/layouts' }
const plugins: import('vite').Plugin[] = [...arao(options), ...namedArao()]
void plugins
// @ts-expect-error decks is a path
arao({ decks: 42 })
// @ts-expect-error layouts is one folder's path
arao({ layouts: ['src/layouts'] })
// @ts-expect-error the named export is the same plugin
namedArao({ icons: 'lucide:rocket' })
// the layouts' declaration file: where it goes, or none
arao({ dts: 'types/arao-layouts.d.ts' })
arao({ dts: false })
// @ts-expect-error dts is a path or a boolean
arao({ dts: 42 })

// the layouts a Slide can name: the library's, and the project's (src/arao-layouts.d.ts, which the
// plugin wrote from src/layouts/quote.css before this check)
const layouts: (keyof SlideLayouts)[] = ['default', 'cover', 'section', 'split', 'image-left', 'image-right', 'quote']
void layouts
// @ts-expect-error no layout of that name
const unknownLayout: keyof SlideLayouts = 'nope'
void unknownLayout
// and the parameters each takes: the library's (from its layouts/), the project's (from its CSS:
// a token that is an HTML attribute's name, quote.css's --ar-layout-quote-title, is none), a
// project layout replacing the library's of its name (section.css) with its own
const own: (keyof ProjectLayouts)[] = ['quote', 'section']
const cover: SlideLayouts['cover'] = { titleSize: '120px', bar: 'gold', footer: 'flex' }
const quote: SlideLayouts['quote'] = { size: '80px', markColor: 'red' }
const section: SlideLayouts['section'] = { tone: 'navy' }
void [own, cover, quote, section]
// @ts-expect-error title is an HTML attribute: no parameter
const titled: SlideLayouts['quote'] = { title: 'x' }
// @ts-expect-error the project's section has none of the library's parameters
const libSection: SlideLayouts['section'] = { bg: 'navy' }
// @ts-expect-error a parameter's value is a string
const sized: SlideLayouts['cover'] = { titleSize: 120 }
void [titled, libSection, sized]

// the app and the Vue plugin
const appOptions: DeckAppOptions = { deckList: 'always' }
const app = createDeckApp(appOptions)
app.use(Arao)
// @ts-expect-error deckList is 'auto' | 'always'…, not a number
createDeckApp({ deckList: 42 })
// @ts-expect-error the plugin installs into an app
Arao.install()

// the directives
// @ts-expect-error step is a directive object, not a function
step(1)
// @ts-expect-error stepFrom is a directive object, not a function
stepFrom(1)

export function inComponent(): void {
  const deck: DeckFace = useDeck()
  const n: number = deck.index.value
  const role: Role = deck.role
  const timer: Timer = deck.timer.value
  void role
  void timer
  deck.next()
  // @ts-expect-error the deck's refs are read-only
  deck.index.value = n + 1
  // @ts-expect-error useDeck() is not a number
  const wrong: number = useDeck
  void wrong

  const slide: SlideControls = useSlide()
  slide.requireSteps(3)
  // @ts-expect-error requireSteps takes a number, ref or getter
  slide.requireSteps({ steps: 3 })
  // @ts-expect-error the slide's step is read-only
  slide.step.value = 2
}

// Slide, typed generic in its layout, is still a component
const slideComponent: import('vue').Component = Slide
void slideComponent

// the components are components (not any)
// @ts-expect-error a component is not a number
const components: number[] = [Deck, Slide, Background, Img, Icon, Snippet, Notes, Cols, Rows, Grid, Center, ProgressBar, SlideNumber]
void components
