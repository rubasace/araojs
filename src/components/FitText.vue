<template lang="pug">
  .mainwrap.flex.full.center.box
      slot

</template>

<script>

import textfit from "textfit";

export default {
  mounted() {
    this.$nextTick(() => {
      this.fitText();
    });
  },
  created() {
    window.addEventListener("resize", this.fitText);
  },
  destroyed() {
    window.removeEventListener("resize", this.fitText);
  },
  computed: {
    containerId() {
      return "fit-text-" + this._uid;
    },
  },
  methods: {
    fitText() {
      textfit(document.getElementsByClassName('box'));
    }
  }
}
</script>
<style scoped>
.mainwrap {
  position: relative;
}
</style>