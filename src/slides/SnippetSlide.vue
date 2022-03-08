<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content
        BaseSlideContent(:title='title' v-bind='$attrs' :hide-footer="hideFooter")
          Snippet(ref='snippet' :file='file' :name='name' :comments='comments' :highlights='highlights' v-bind='$attrs')
</template>

<script>

import {Slide} from "eagle.js";
import BaseSlideContent from "../components/BaseSlideContent";
import Snippet from "../components/Snippet";

export default {
  inheritAttrs: false,
  components: {
    Snippet,
    BaseSlideContent,
  },
  props: {
    title: String,
    file: {
      type: String,
    },
    name: String,
    comments: {
      type: Object,
      default: function () {
        return {}
      }
    },
    highlights: {
      type: Object,
      default: function () {
        return {}
      }
    },
    stepNum: {
      type: Number,
      default: undefined
    },
    hideFooter: {
      type: Boolean,
      default: true
    }
  },
  mixins: [Slide],
  beforeUpdate() {
    this.$nextTick(() => {
      //TODO try to fix warnings
      this.steps=this.stepNum ?? this.$refs.snippet.requiredSteps;
    })
  },
}

</script>

<style scoped lang="sass">

.baseSlide
  height: 100%

</style>