<template lang="pug">
  .image-links
    template(v-for='imageUrl, i in images')
      link(rel='preload' as='image' :href='imageUrl')

</template>

<script>

export default {
  data() {
    return {
      images: require.context(`@/assets/images`, true).keys()
          .map(image => require("@/assets/images/" + image.substring(2)))
    }
  }
}
</script>
