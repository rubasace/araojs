<template lang='pug'>
  .container
    .code-box
      pre(:class='"line-numbers language-"+lang' ref='pre')
        code(:id='id3' ref='code')
    .comments-box
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
      textfit(this.$refs.pre)
    }
  }
}
</script>
<style lang='sass' scoped>
.container
  position: relative
  width: 100%

  .eg-code-block
    text-align: left
    font-size: 0.5em

    .box
      padding: 0

  .comments-box
    position: absolute
    color: rgba(0, 0, 0, 0.0)
    top: 0
    display: none

</style>
