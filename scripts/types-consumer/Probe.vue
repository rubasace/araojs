<!-- the globally registered components and directives are typed in templates -->
<template>
  <Deck :width="1920" :themes="themes">
    <Slide layout="image-right" class="center no-footer">
      <Background src="city.jpg" :opacity="0.4" fit="cover" />
      <p v-step="2">two</p>
      <Cols ratio="2 1"><div /><div /></Cols>
      <Snippet file="App.java" :size="30" />
      <Img file="team.jpg" fit="cover" />
      <Icon name="lucide:rocket" />
    </Slide>
    <!-- @vue-expect-error width is a number -->
    <Deck :width="'wide'" />
    <!-- @vue-expect-error layout is a name, not a number -->
    <Slide :layout="2" />
    <!-- a layout of the library's, and one of the project's (src/layouts/quote.css, written into
         src/arao-layouts.d.ts by the plugin) -->
    <Slide layout="cover" />
    <Slide layout="quote" />
    <!-- @vue-expect-error layout is a layout's name, the library's or the project's -->
    <Slide layout="nope" />
    <!-- a layout's parameters are attributes, written in kebab-case or camelCase: the library's
         (generated from its CSS), and the project's (src/arao-layouts.d.ts) -->
    <Slide layout="image-right" columns="2fr 1fr" footer-bg="black" class="center" />
    <Slide layout="cover" title-size="120px" bar="gold" />
    <Slide layout="cover" titleSize="120px" />
    <Slide layout="quote" size="80px" mark-color="red" />
    <Slide layout="section" tone="navy" />
    <!-- @vue-expect-error columns is image-right's parameter, not cover's -->
    <Slide layout="cover" columns="2fr 1fr" />
    <!-- @vue-expect-error the default layout takes none -->
    <Slide columns="2fr 1fr" />
    <!-- @vue-expect-error the project's section replaces the library's, parameters too: no bg -->
    <Slide layout="section" bg="navy" />
    <!-- @vue-expect-error a parameter's value is a string -->
    <Slide layout="cover" :bar="1" />
    <!-- the zones and #title, each given the step -->
    <Slide layout="split">
      <template #title="{ step }"><h2>{{ step.toFixed(0) }}</h2></template>
      <template #left="{ step }">{{ step.toFixed(0) }}</template>
      <template #right>right</template>
    </Slide>
    <!-- a slide's named templates are its layout's zones: the library's (image-right: image), the
         project's (quote: author, its @zone, and source, which its CSS styles) -->
    <Slide layout="image-right"><template #image>picture</template></Slide>
    <Slide layout="quote"><template #author>Kent Beck</template><template #source>a talk</template></Slide>
    <Slide layout="split">
      <!-- @vue-expect-error image is image-right's zone, not split's -->
      <template #image>picture</template>
    </Slide>
    <Slide>
      <!-- @vue-expect-error the default layout has no zone -->
      <template #left>left</template>
    </Slide>
    <Slide layout="section">
      <!-- @vue-expect-error author is quote's zone; the project's section has none -->
      <template #author>nobody</template>
    </Slide>
    <!-- a slide whose layout may be any of several takes the zones of any of them -->
    <Slide :layout="either(1)"><template #left>left</template><template #image>picture</template></Slide>
    <Slide :layout="either(0)">
      <!-- @vue-expect-error author is quote's zone, neither split's nor image-right's -->
      <template #author>nobody</template>
    </Slide>
    <!-- a zone the project declares on a library layout (src/arao-zones.d.ts: split's caption) -->
    <Slide layout="split"><template #caption>a caption</template><template #left>left</template></Slide>
    <!-- @vue-expect-error fit is 'cover' or 'contain' -->
    <Background fit="fill" />
    <!-- @vue-expect-error size is a number -->
    <Snippet :size="'big'" />
    <!-- @vue-expect-error fit is 'cover' or 'contain' -->
    <Img fit="fill" />
    <!-- @vue-expect-error an icon needs its name -->
    <Icon />
  </Deck>
</template>

<script setup lang="ts">
const themes = ['default'] as const
// a layout chosen from data: one of two
const either = (n: number): 'split' | 'image-right' => (n ? 'split' : 'image-right')
</script>
