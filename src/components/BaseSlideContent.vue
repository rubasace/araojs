<template lang="pug">
  .baseSlide
    TransparentBackground(v-bind='$attrs')
    .header(v-if="title !== undefined" v-visible="title")
      h3.title {{title}}
    .body
      .body-content.full.flex.center.even
        slot
    .footer(v-if="!hideFooter")
      .logo
</template>

<script>
//TODO take num of elements into account to calculate steps??? probably to separate component. Add flag to display first only title?

import TransparentBackground from "./TransparentBackground";

export default {
  components: {
    TransparentBackground
  },
  props: {
    title: String,
    hideFooter: {
      type: Boolean,
      default: true
    }
  }
}

</script>

<style scoped lang="sass">

.baseSlide
  height: 100%

</style>