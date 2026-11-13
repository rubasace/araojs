<!-- shots: 1 3 -->
<template lang="pug">
Deck
  Slide
    h2 What we wanted
    ul
      li #[Icon.done(name="lucide:circle-check")] Same defaults in every service
      li(v-step="2") #[Icon.done(name="lucide:circle-check")] Logging and metrics for free
      li(v-step="3") #[Icon.done(name="lucide:circle-check")] Upgrades in one place
</template>

<style scoped>
.done { color: var(--ar-accent); }
</style>
