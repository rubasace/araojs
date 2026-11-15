<template lang="pug">
Deck
  Slide(layout="cover")
    Background(src="cies.svg" opacity="0.4")
    .bar
    h1 The Cíes islands
    p.muted A guillemot's guide

  Slide(layout="image-right" style="--ar-layout-image-right-columns: 3fr 2fr")
    template(#image)
      Img(file="cies.svg" alt="The Cíes islands at dusk")
    h2 One picture, one idea
    p The picture fills its side, edge to edge.
    p.muted Named from the images folder, never imported.

  Slide
    Background(src="cies.svg" opacity="0.25" blur="6")
    h2 Behind the words
    p A background faded into the theme, with one line.
</template>
