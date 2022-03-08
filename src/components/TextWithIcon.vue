<template lang="pug">
  .flex.center.full
    .text-with-icon.full-width
      img.item-image(:src="iconFile")
      .item-text
        p.item-name(v-if="text") {{text}}
        p.item-comment(v-if="subText") {{subText}}
</template>

<script>
export default {
  props: {
    text: String,
    subText: String,
    icon: String
  },
  data() {
    return {
      iconFile: require('@/assets/icons/' + this.icon)
    }
  },
}

</script>

<style scoped lang="sass">

// TODO fix height so it always fits properly
.text-with-icon
  img
    // TODO revisit if maybe percentage makes more sense
    height: 10em
  p
    text-transform: uppercase
    font-size: 2.5em
    font-weight: bold

</style>