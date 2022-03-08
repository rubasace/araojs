<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content.flex.center.full-text-slide-background(:style="cssProps")
        .full-size-box.flex.center
          .content.full-width
              slot
</template>

<script>
//TODO add opacity to images
import {Slide} from "eagle.js";

export default {
  data() {
    return {
      cssProps: {
        backgroundImage: this.backgroundImage ? `url(${require('@/assets/images/' + this.backgroundImage)})` : null
      }
    }
  },
  props: {
    backgroundImage: String
  },
  mixins: [Slide]
}

</script>

<style scoped lang="sass">

span
  font-weight: bold

.full-text-slide-background
  background-size: cover

</style>