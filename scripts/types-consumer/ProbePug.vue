<!-- the same in Pug, checked through @vue/language-plugin-pug (vueCompilerOptions.plugins): a
     layout's parameters and its zones, and no other layout's. @vue-expect-error is a literal HTML
     comment line: Pug's own comments (// …) do not reach the check -->
<template lang="pug">
Deck
  Slide(layout="image-right" columns="3fr 2fr")
    template(#image="{ step }") {{ step.toFixed(0) }}
    h2 One picture
  Slide(layout="split" gap="96px")
    template(#title)
      h2 Split
    template(#left) left
    template(#right) right
  Slide(layout="quote" size="80px")
    blockquote Make it work.
    template(#author) Kent Beck
  <!-- @vue-expect-error columns is image-right's parameter, not cover's -->
  Slide(layout="cover" columns="2fr 1fr")
  Slide(layout="split")
    <!-- @vue-expect-error image is image-right's zone, not split's -->
    template(#image) picture
  Slide
    <!-- @vue-expect-error the default layout has no zone -->
    template(#left) left
</template>
