<template lang="pug">
Deck(:themes="['midnight']")
  Slide(layout="cover")
    .bar
    h1 Live coding with Vue
    p.muted No slides were harmed in the making of this talk

  Slide
    h2 A counter
    Snippet(file="Counter.vue" fit :highlights='{ "4": 2, "8:@click+++count": 3 }')

  Slide
    h2 Start the server
    Snippet(code="npm run dev" lang="bash" name="terminal" fit :line-numbers="false")
</template>
