<template lang="pug">
Deck(:themes="['ocean', 'sage', 'midnight', 'default']")
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide(layout="grid" align="start")
    h2 Same slides, another venue
    div
      h3 #[Icon.accent(name="lucide:palette")] Colours
      p Background, text, accent
    div
      h3 #[Icon.accent(name="lucide:type")] Type
      p Fonts and their sizes
    div
      h3 #[Icon.accent(name="lucide:panel-bottom")] Zones
      p Title, body, footer
</template>
