<!-- the same in Pug, checked through @vue/language-plugin-pug (vueCompilerOptions.plugins): a
     layout's parameters and its zones, and no other layout's. @vue-expect-error is a literal HTML
     comment line: Pug's own comments (// …) do not reach the check -->
<template lang="pug">
Deck
  Slide(layout="image-right" columns="3fr 2fr")
    template(#image="{ step }") {{ step.toFixed(0) }}
    h2 One picture
  Slide(layout="split" gap="96px" divider="2px solid red")
    template(#title)
      h2 Split
    div left
    div right
  Slide(layout="grid" columns="4" icon-size="64px")
    h2 Grid
    div
      Icon(name="lucide:rocket")
      h3 One
  Slide(layout="agenda" current-weight="400")
    h2 Agenda
    Agenda
  Slide(layout="callout" size="80px")
    blockquote Make it work.
    template(#author) Kent Beck
  <!-- @vue-expect-error columns is image-right's parameter, not cover's -->
  Slide(layout="cover" columns="2fr 1fr")
  Slide(layout="split")
    <!-- @vue-expect-error image is image-right's zone, not split's -->
    template(#image) picture
  Slide(layout="split")
    <!-- @vue-expect-error split has no zone: its sides are its body's children -->
    template(#left) left
  Slide
    <!-- @vue-expect-error the default layout has no zone -->
    template(#left) left
</template>
