<template lang="pug">
Deck(:themes="['ocean', 'sunset', 'midnight', 'default']")
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide
    h2 Same slides, another venue
    Cols(gap="lg")
      div
        h3 #[Icon(name="lucide:palette")] Colours
        p.muted Background, text, accent
      div
        h3 #[Icon(name="lucide:type")] Type
        p.muted Fonts and their sizes
      div
        h3 #[Icon(name="lucide:panel-bottom")] Zones
        p.muted Title, body, footer
</template>

<style scoped>
h3 .ar-icon { color: var(--ar-accent); }
</style>
