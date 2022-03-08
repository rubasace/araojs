<template lang='pug'>
  .container
    .code-box
      pre(:id='id' :class='"line-numbers language-"+lang')
        code(:id='id3')
    .comments-box
      pre
        code(:id='id2')
          slot
</template>

<script>

//TODO cleanup this copy-paste a bit :)
function randId() {
  return Math.random().toString(36).substr(2, 10)
}

import Prism from 'prismjs';

export default {
  props: {
    id: {default: () => randId()},
    id2: {default: () => randId()},
    id3: {default: () => randId()},
    lang: String
  },
  mounted: function () {
    this.update()
  },
  updated: function () {
    this.update()
  },
  methods: {
    update: function () {
      var codeBlock = document.getElementById(this.id)
      var commentsContent = document.getElementById(this.id2)
      var codeContent = document.getElementById(this.id3)
      codeContent.innerHTML = commentsContent.innerHTML
      this.$nextTick(() => {
        Prism.highlightElement(codeBlock)
      })
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
