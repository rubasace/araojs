<template lang="pug">
Deck
  Slide(layout="split")
    h2 Before and after
    div
      h3 #[Icon(name="lucide:git-fork")] Before
      ul
        li Every team rolled its own
        li Twelve ways to log
    div(v-step="2")
      h3 #[Icon(name="lucide:package-check")] After
      ul
        li One starter for all
        li One version to bump
</template>
