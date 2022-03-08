<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content
        BaseSlideContent(v-bind="$attrs" :title="title")
          slot
</template>

<script>

import {Slide} from "eagle.js";
import BaseSlideContent from "../components/BaseSlideContent";

export default {
  inheritAttrs: false,
  components: {
    BaseSlideContent,
  },
  props: {
    title: String
  },
  mixins: [Slide]
}

</script>