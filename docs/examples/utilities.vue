<template lang="pug">
Deck
  Slide(layout="split")
    h2 Inside a block
    div
      h3 A row, a stack
      .stack
        .row
          Icon.accent(name="lucide:ruler" size="120")
          .stack.gap-sm.grow
            p.text-lg An icon or a picture beside its text
            p.text-sm.muted .row around them, .grow on the text
        p Mark a #[span.highlight word], or say it in #[span.accent the accent].
    div(v-step="2")
      h3 Code beside a list
      .cols.grow.middle(style="--ar-cols: 3fr 2fr")
        Snippet(code="npm install\nnpm run dev" lang="bash" name="terminal" fit :line-numbers="false")
        ul.text-sm
          li Each in its column
          li.muted Centred top to bottom
</template>
