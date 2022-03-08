<template lang="pug">
  .flex.center.full
    .quote.full-width
      .message
        blockquote.text
          slot
      .author(v-if='author')
        cite
          span.name {{author}}
</template>

<script>
//TODO style properly

export default {
  props: {
    text: String,
    author: String
  }
}
</script>

<style scoped lang="sass">

.quote
  display: flex
  flex-direction: column
  justify-content: center
  .text
    margin: 0
    margin-bottom: 1rem
    padding-left: 1em
    line-height: 1.15em
    font-weight: 300
    font-size: 2.8em
    text-transform: uppercase
    &:before
      content: '\201C'
    &:after
      content: '\201D'

  .author
    font-size: 1.6em
    text-transform: capitalize
    text-align: right
    margin-right: 5%
    font-weight: 300
    .name
      &:before
        content: '\002D\0020'

</style>