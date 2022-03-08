<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content
        TransparentBackground(v-bind='$props')
        .sectionTitle
          p.title(:style="titleCssProps")
            slot
</template>

<script>

// TODO add something related to the conference? (logo, whatever)
// TODO maybe easier to center if we control width of a div removing from left/right and align text to center (so it's equidistant both from edge of the slide and image, just by aligning the edge of the div with the picture)

import {Slide} from "eagle.js";
import TransparentBackground from "./TransparentBackground";

export default {
  components: {TransparentBackground},
  mixins: [Slide],
  props: {
    backgroundImage: {
      type: String,
      required: true
    },
    backgroundOpacity: {
      type: Number,
      default: 0.6
    },
    backgroundPositionX: {
      type: String,
      default: "0em"
    },
    backgroundPositionY: {
      type: String,
      default: "0em"
    },
    color: {
      type: String,
      default: "white"
    },
    fontSize: {
      type: String,
      default: "3em"
    },
    top: {
      type: String,
      default: "0em"
    },
    left: {
      type: String,
      default: "0em"
    },
    width: {
      type: String,
      default: "8em"
    }

  },
  data() {
    return {
      titleCssProps: {
        color: this.color,
        fontSize: this.fontSize,
        top: this.top,
        left: this.left,
        width: this.width,
      }
    }
  }
}

</script>

<style scoped lang="sass">

.eg-slide-content
  background-size: cover

  .sectionTitle
    width: 100%
    height: 100%
    display: flex
    flex-direction: column
    align-content: center
    align-items: center
    justify-content: center

    .title
      text-shadow: 0.05em 0.05em 0.1em black
      position: relative
      color: whitesmoke !important
      //box-sizing: border-box
      //margin-left: 1em
      //margin-right: 1em
      //padding-left: 0em
      //padding-right: 0em //TODO move this to props so they help with positioning. Also think about same for vertical alignment??

</style>