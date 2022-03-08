<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content.flex.center
        TransparentBackground(v-bind='$props')
        .full-size-box.flex.center
            span
              slot
</template>

<script>
import {Slide} from "eagle.js";
import TransparentBackground from "../components/TransparentBackground";

export default {
  components: {
    TransparentBackground
  },
  props: {
    backgroundImage: String,
    backgroundOpacity: Number,
  },
  mixins: [Slide]
}

</script>

<style scoped lang="sass">

span
  font-weight: bold
  font-size: 2.5rem
  text-transform: uppercase

</style>