<!-- the globally registered components and directives are typed in templates -->
<template>
  <Deck :width="1920" :themes="themes">
    <Slide layout="image-right" class="center no-footer">
      <Background src="city.jpg" :opacity="0.4" fit="cover" />
      <p v-step="2">two</p>
      <div class="cols grow" style="--ar-cols: 2fr 1fr"><div /><div /></div>
      <Snippet file="App.java" :size="30" />
      <Img file="team.jpg" fit="cover" />
      <Icon name="lucide:rocket" />
      <Agenda />
      <!-- the current section forced, by its place or its title; the plain list -->
      <Agenda :current="2" />
      <Agenda current="How it works" />
      <Agenda :highlight="false" />
    </Slide>
    <!-- @vue-expect-error highlight is a boolean: bound, :highlight="false" -->
    <Agenda highlight="no" />
    <!-- @vue-expect-error current is a section's place or its title -->
    <Agenda :current="true" />
    <!-- @vue-expect-error width is a number -->
    <Deck :width="'wide'" />
    <!-- @vue-expect-error layout is a name, not a number -->
    <Slide :layout="2" />
    <!-- a layout of the library's, and one of the project's (src/layouts/callout.css, written into
         src/arao-layouts.d.ts by the plugin) -->
    <Slide layout="cover" />
    <Slide layout="callout" />
    <!-- @vue-expect-error layout is a layout's name, the library's or the project's -->
    <Slide layout="nope" />
    <!-- a layout's parameters are attributes, written in kebab-case or camelCase: the library's
         (generated from its CSS), and the project's (src/arao-layouts.d.ts) -->
    <Slide layout="image-right" columns="2fr 1fr" footer-bg="black" class="center" />
    <Slide layout="cover" title-size="120px" bar="gold" />
    <Slide layout="cover" titleSize="120px" />
    <Slide layout="callout" size="80px" mark-color="red" align="start" />
    <Slide layout="overlay" position="top-right" scrim=".4" color="#fff" />
    <Slide layout="grid" columns="4" max-columns="3" icon-size="64px" cards="none" align="start" text-size="1em" />
    <Slide layout="split" divider="2px solid red" gap="96px" />
    <Slide layout="quote" mark="'«'" mark-color="red" />
    <Slide layout="caption" caption-size="24px" captionAlign="start" />
    <!-- @vue-expect-error agenda is no layout any more: a Slide with an Agenda in it -->
    <Slide layout="agenda" />
    <!-- @vue-expect-error icon-size is grid's parameter, not split's -->
    <Slide layout="split" icon-size="64px" />
    <Slide layout="section" tone="navy" />
    <!-- @vue-expect-error columns is image-right's parameter, not cover's -->
    <Slide layout="cover" columns="2fr 1fr" />
    <!-- @vue-expect-error the default layout takes none -->
    <Slide columns="2fr 1fr" />
    <!-- @vue-expect-error the project's section replaces the library's, parameters too: no bg -->
    <Slide layout="section" bg="navy" />
    <!-- @vue-expect-error a parameter's value is a string -->
    <Slide layout="cover" :bar="1" />
    <!-- @vue-expect-error position is one of the nine places its doc block lists -->
    <Slide layout="overlay" position="end start" />
    <!-- @vue-expect-error the project's callout aligns start or center -->
    <Slide layout="callout" align="end" />
    <!-- the zones and #title, each given the step -->
    <Slide layout="image-left">
      <template #title="{ step }"><h2>{{ step.toFixed(0) }}</h2></template>
      <template #image="{ step }">{{ step.toFixed(0) }}</template>
    </Slide>
    <!-- a slide's named templates are its layout's zones: the library's (image-right: image), the
         project's (callout: author, its @zone, and source, which its CSS styles) -->
    <Slide layout="image-right"><template #image>picture</template></Slide>
    <Slide layout="callout"><template #author>Kent Beck</template><template #source>a talk</template></Slide>
    <Slide layout="split">
      <!-- @vue-expect-error image is image-right's zone, not split's -->
      <template #image>picture</template>
    </Slide>
    <Slide layout="split">
      <!-- @vue-expect-error split has no zone: its sides are its body's children -->
      <template #left>left</template>
    </Slide>
    <Slide>
      <!-- @vue-expect-error the default layout has no zone -->
      <template #left>left</template>
    </Slide>
    <Slide layout="section">
      <!-- @vue-expect-error author is callout's zone; the project's section has none -->
      <template #author>nobody</template>
    </Slide>
    <!-- a slide whose layout may be any of several takes the zones of any of them -->
    <Slide :layout="either(1)"><template #author>Kent Beck</template><template #image>picture</template></Slide>
    <Slide :layout="either(0)">
      <!-- @vue-expect-error left is no zone of callout's nor of image-left's -->
      <template #left>nobody</template>
    </Slide>
    <!-- a zone the project declares on a library layout (src/arao-zones.d.ts: image-right's caption) -->
    <Slide layout="image-right"><template #caption>a caption</template><template #image>picture</template></Slide>
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
const either = (n: number): 'callout' | 'image-left' => (n ? 'callout' : 'image-left')
</script>
