// English: the engine's own UI text, and what any other language falls back to. Every catalogue
// has exactly these keys, each a string or, when the message takes values, a function of them
// (the library build checks it: vite.config.js, catalogueError).
export default {
  // the controls (components/internal/Controls.vue)
  controls: 'Deck controls',
  first: 'First (Home)',
  previous: 'Previous (←)',
  next: 'Next (→)',
  last: 'Last (End)',
  goTo: 'Go to… (g)',
  stepOf: (step, steps) => `Step ${step} of ${steps}`,
  step: (n) => `Step ${n}`,
  themeButton: (name) => `Theme: ${name} (t)`,
  presenterView: 'Presenter view (p)',
  fullscreen: 'Full screen (f)',
  exitFullscreen: 'Exit full screen (f)',
  goToSlide: 'Go to slide',
  numberOrTitle: 'Number or title…',
  untitled: 'Untitled',
  noMatch: 'Nothing matches',
  theme: 'Theme',

  // the audience view: the browser blocked the presenter window (views/AudienceView.vue)
  presenterBlocked: 'The browser blocked the presenter window.',
  openItHere: 'Open it here',

  // the presenter view (views/PresenterView.vue)
  presenterTitle: 'Presenter',
  currentSlide: 'Current slide',
  upNext: 'Next',
  slide: (n) => `Slide ${n}`,
  endOfDeck: 'End of the deck',
  notes: 'Notes',
  noNotes: 'No notes on this slide',

  // its bar: the timer, the clock, the talk's length (components/internal/PresenterBar.vue)
  elapsed: 'Time elapsed',
  clock: 'Time of day',
  startTimer: 'Start the timer',
  pauseTimer: 'Pause the timer',
  resumeTimer: 'Resume the timer',
  resetTimer: 'Reset the timer (it starts again on the next move)',
  timerIdle: 'starts on the next move',
  timerPaused: 'paused',
  timeLeft: (time) => `${time} left`,
  timeOver: (time) => `${time} over`,
  talkLength: 'Length of the talk',
  lengthButton: 'length',
  setLength: 'Set a length for the talk (countdown)',
  lengthIs: (time) => `Length of the talk: ${time}. Change it`,
  lengthChanged: (time, deck) => `Length of the talk: ${time}, changed (${deck}). Change it`,
  deckLength: (time) => `the deck's: ${time}`,
  deckNoLength: 'the deck has none',
  apply: 'Apply',
  lengthHint: '90, 45m, 1h30, 45:00… · Enter applies, Esc cancels',
  backToDeckLength: (time) => `Back to the deck's: ${time}`,
  removeCountdown: 'Remove the countdown',
  lengthEmpty: 'Type a length: 90, 45m, 1h30 or 45:00',
  lengthInvalid: (text) => `“${text}” is not a length: try 90, 45m, 1h30 or 45:00`,
  lengthTooShort: (text) => `“${text}” is too short: from 1 minute to 24 hours`,
  lengthTooLong: (text) => `“${text}” is too long: from 1 minute to 24 hours`,
  lengthNowIs: (time) => `Changed while you were editing: now ${time}`,
  lengthNowNone: 'Changed while you were editing: no countdown any more',

  // the list of decks (views/DeckSelectorView.vue, components/internal/DeckCover.vue)
  decks: 'Decks',
  deckCount: (n) => (n === 1 ? '1 deck' : `${n} decks`),
  noSuchDeck: (name) => `There is no deck “${name}”.`,
  noSuchDeckPick: (name) => `There is no deck “${name}”. Pick one:`,
  noDecks: (dir) => `No decks in ${dir}: each .vue file directly in that folder is one.`,
  noPreview: 'No preview',

  // the export's notes pages (core/exporter.js, views/ExportView.vue)
  fromStep: (n) => `From step ${n}`,
  atStep: (n) => `At step ${n}`,
}
