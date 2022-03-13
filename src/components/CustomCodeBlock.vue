<template lang='pug'>
  .container.full
    .code-box.full
      pre(:class='"processed-snippet language-"+lang' ref='pre').full
        code(:id='id3' ref='code')
    .raw-snippet
      pre
        code(ref='raw')
          slot
</template>

<script>

import Prism from 'prismjs';
import textfit from "textfit";

function randId() {
  return Math.random().toString(36).substr(2, 10)
}


export default {
  props: {
    id3: {default: () => randId()},
    lang: String
  },
  updated: function () {
    this.update()
  },
  created() {
    window.addEventListener("resize", this.fitCode);
  },
  destroyed() {
    window.removeEventListener("resize", this.fitCode);
  },
  methods: {
    update() {
      var codeBlock = this.$refs.pre
      var commentsContent = this.$refs.raw
      var codeContent = document.getElementById(this.id3)
      codeContent.innerHTML = commentsContent.innerHTML
      Prism.highlightElement(codeBlock)
      this.fitCode()
    },
    fitCode() {
      textfit(this.$refs.pre, {minFontSize:1})
    }
  }
}
</script>
<style lang='sass' scoped>
.container
  position: relative
  width: 100%
  .code-box
    .processed-snippet
      padding-right: 1em
      box-sizing: border-box
  pre,
  code
    padding: 0
    box-sizing: border-box
    margin: 0
  .raw-snippet
    position: absolute
    color: rgba(0, 0, 0, 0.0)
    top: 0
    display: none

</style>
