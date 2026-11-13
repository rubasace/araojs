<template lang="pug">
Deck
  Slide(layout="split")
    h2 Before and after
    template(#left)
      h3 #[Icon(name="lucide:git-fork")] Before
      ul
        li Every team rolled its own
        li Twelve ways to log
    template(#right)
      h3(v-step="2") #[Icon(name="lucide:package-check")] After
      ul(v-step="2")
        li One starter for all
        li One version to bump
</template>
