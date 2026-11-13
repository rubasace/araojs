<template lang="pug">
Deck
  Slide(layout="cover" bg="cies.svg" bg-opacity="0.4")
    .bar
    h1 The Cíes islands
    p.muted A guillemot's guide

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      Img(file="cies.svg" alt="The Cíes islands at dusk")
    h2 One picture, one idea
    p The picture fills its side, edge to edge.
    p.muted Named from the images folder, never imported.

  Slide(bg="cies.svg" bg-opacity="0.25" bg-blur="6")
    h2 Behind the words
    p A background faded into the theme, with one prop.
</template>
