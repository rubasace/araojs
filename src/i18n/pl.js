// Polski (the keys and what each says: en.js)

// 1 prezentacja, 2–4 (but 12–14) prezentacje, the rest prezentacji
const plural = (n, one, few, many) => {
  if (n === 1) return one
  const d = n % 10, dd = n % 100
  return d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14) ? few : many
}

export default {
  controls: 'Sterowanie prezentacją',
  first: 'Pierwszy (Home)',
  previous: 'Poprzedni (←)',
  next: 'Następny (→)',
  last: 'Ostatni (End)',
  goTo: 'Przejdź do… (g)',
  stepOf: (step, steps) => `Krok ${step} z ${steps}`,
  step: (n) => `Krok ${n}`,
  themeButton: (name) => `Motyw: ${name} (t)`,
  presenterView: 'Widok prezentera (p)',
  fullscreen: 'Pełny ekran (f)',
  exitFullscreen: 'Zamknij pełny ekran (f)',
  goToSlide: 'Przejdź do slajdu',
  numberOrTitle: 'Numer lub tytuł…',
  untitled: 'Bez tytułu',
  noMatch: 'Brak wyników',
  theme: 'Motyw',

  presenterBlocked: 'Przeglądarka zablokowała okno prezentera.',
  openItHere: 'Otwórz je tutaj',

  presenterTitle: 'Prezenter',
  currentSlide: 'Bieżący slajd',
  upNext: 'Następny',
  slide: (n) => `Slajd ${n}`,
  endOfDeck: 'Koniec prezentacji',
  notes: 'Notatki',
  noNotes: 'Brak notatek do tego slajdu',

  elapsed: 'Upłynęło',
  clock: 'Godzina',
  startTimer: 'Uruchom czas',
  pauseTimer: 'Wstrzymaj czas',
  resumeTimer: 'Wznów czas',
  resetTimer: 'Wyzeruj czas (ruszy przy następnym kroku)',
  timerIdle: 'ruszy przy następnym kroku',
  timerPaused: 'wstrzymany',
  timeLeft: (time) => `zostało ${time}`,
  timeOver: (time) => `${time} ponad czas`,
  talkLength: 'Czas wystąpienia',
  lengthButton: 'czas',
  setLength: 'Ustaw czas wystąpienia (odliczanie)',
  lengthIs: (time) => `Czas wystąpienia: ${time}. Zmień`,
  lengthChanged: (time, deck) => `Czas wystąpienia: ${time}, zmieniony (${deck}). Zmień`,
  deckLength: (time) => `w prezentacji: ${time}`,
  deckNoLength: 'prezentacja go nie ma',
  apply: 'Zastosuj',
  lengthHint: '90, 45m, 1h30, 45:00… · Enter zatwierdza, Esc anuluje',
  backToDeckLength: (time) => `Wróć do czasu z prezentacji: ${time}`,
  removeCountdown: 'Usuń odliczanie',
  lengthEmpty: 'Wpisz czas: 90, 45m, 1h30 lub 45:00',
  lengthInvalid: (text) => `„${text}” to nie jest czas: spróbuj 90, 45m, 1h30 lub 45:00`,
  lengthTooShort: (text) => `„${text}” to za krótko: od 1 minuty do 24 godzin`,
  lengthTooLong: (text) => `„${text}” to za długo: od 1 minuty do 24 godzin`,
  lengthNowIs: (time) => `Zmieniono podczas edycji: teraz ${time}`,
  lengthNowNone: 'Zmieniono podczas edycji: nie ma już odliczania',

  decks: 'Prezentacje',
  deckCount: (n) => `${n} ${plural(n, 'prezentacja', 'prezentacje', 'prezentacji')}`,
  noSuchDeck: (name) => `Nie ma prezentacji „${name}”.`,
  noSuchDeckPick: (name) => `Nie ma prezentacji „${name}”. Wybierz jedną:`,
  noDecks: (dir) => `Brak prezentacji w ${dir}: każdy plik .vue bezpośrednio w tym folderze to jedna prezentacja.`,
  noPreview: 'Brak podglądu',

  fromStep: (n) => `Od kroku ${n}`,
  atStep: (n) => `W kroku ${n}`,
}
