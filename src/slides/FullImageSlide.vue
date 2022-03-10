<template lang="pug">
  eg-transition(:enter='enter', :leave='leave')
    .eg-slide(v-if='active')
      .eg-slide-content.flex.center
        .full-size-box.flex.center
          img(:src="imageFile").full-width
</template>

<script>
import {Slide} from "eagle.js";

export default {
  props: {
    image: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      imageFile: require('@/assets/images/'+this.image)
    }
  },
  mixins: [Slide]
}

</script>

<style scoped lang="sass">

img

</style>