<template lang="pug">
  .background(:style='cssProps')

</template>

<script>
export default {
  props: {
    backgroundImage: String,
    backgroundOpacity: {
      type: Number,
      default: 0.5
    },
    backgroundPositionX: {
      type: String,
      default: "0em"
    },
    backgroundPositionY: {
      type: String,
      default: "0em"
    },
  },
  data() {
    return {
      cssProps: {
        backgroundImage: this.backgroundImage ? `linear-gradient(rgba(0, 0, 0, ${this.backgroundOpacity}),rgba(0, 0, 0, ${this.backgroundOpacity})),url(${require('@/assets/images/' + this.backgroundImage)})` : null,
        backgroundPositionX: this.backgroundPositionX,
        backgroundPositionY: this.backgroundPositionY
      },
    }
  },
}

</script>

<style scoped lang="sass">

.background
  position: absolute
  top: 0
  bottom: 0
  left: 0
  right: 0
  background-size: cover !important

</style>