import { computed, onMounted, ref, toValue } from 'vue'
import { buildBook, reportReady } from '../core/exporter'
import { titleOf } from '../core/stage'

// Internal. Export mode (?export, core/exporter.js): once the deck has mounted, its stage is walked
// into the book of pages, and the result is reported for the export CLI. Nothing without options.
//   const { book, notesBox, done, shownNotes } = useExport(stage, { options, theme, themes, viewport, width, height })
//   options      exportOptions(query): { perStep, notes }, or null (not exporting)
//   book         template ref: the element the pages are copied into
//   notesBox     template ref: the notes of the slide on screen (shownNotes), copied after its page(s)
//   done         true once the book is complete
//   shownNotes   the notes the presenter view would show at this step (the book takes them at the
//                slide's last step)
// themes, width, height: values, or refs or getters of them; viewport: a ref to the deck's viewport.
export function useExport(stage, { options, theme, themes, viewport, width, height }) {
  const book = ref()
  const notesBox = ref()
  const done = ref(false)
  const shownNotes = computed(() => (stage.current.value?.notes ?? []).filter((n) => n.step <= stage.step.value))

  async function run() {
    const list = toValue(themes)
    if (!list.includes(theme.value))
      return reportReady({ error: `theme "${theme.value}" is not one of the deck's themes: ${list.join(', ')}` })
    try {
      const result = await buildBook({
        stage,
        canvas: viewport.value.querySelector(':scope > .ar-stage > .ar-canvas'),
        book: book.value,
        notes: options.notes ? notesBox.value : null,
        title: (i) => titleOf(stage.list[i]),
        perStep: options.perStep,
        width: toValue(width),
        height: toValue(height),
      })
      done.value = true
      reportReady({ ...result, theme: theme.value })
    } catch (e) {
      console.error('[arao] export failed', e)
      reportReady({ error: String(e?.message || e) })
    }
  }
  if (options) onMounted(run)

  return { book, notesBox, done, shownNotes }
}
