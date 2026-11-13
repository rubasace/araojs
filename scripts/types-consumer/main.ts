// A TypeScript project using araojs: what its types must allow, and what they must reject. Each
// public export has an @ts-expect-error: if its type became `any`, the directive would be unused
// and the check would fail.
import Arao, {
  createDeckApp, useDeck, useSlide, step, stepFrom,
  Deck, Slide, Img, Icon, Snippet, Notes, Cols, Rows, Grid, Center, ProgressBar, SlideNumber,
  type DeckFace, type DeckAppOptions, type SlideControls, type Role, type Timer,
} from 'araojs'
import arao, { arao as namedArao, type AraoOptions } from 'araojs/vite'

// the Vite plugin, default and named
const options: AraoOptions = { decks: 'src/decks', themes: ['src/themes', 'arao-themes'] }
const plugins: import('vite').Plugin[] = [...arao(options), ...namedArao()]
void plugins
// @ts-expect-error decks is a path
arao({ decks: 42 })
// @ts-expect-error the named export is the same plugin
namedArao({ icons: 'lucide:rocket' })

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

// the components are components (not any)
// @ts-expect-error a component is not a number
const components: number[] = [Deck, Slide, Img, Icon, Snippet, Notes, Cols, Rows, Grid, Center, ProgressBar, SlideNumber]
void components
