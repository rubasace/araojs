<!-- Picks the deck from ?deck=<name> (default: demo). -->
<template lang="pug">
component(:is="deck")
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const decks = import.meta.glob('./decks/*.vue')
const name = new URLSearchParams(location.search).get('deck') || 'Demo'
const key = Object.keys(decks).find((k) => k.toLowerCase() === `./decks/${name.toLowerCase()}.vue`) || './decks/Demo.vue'
const deck = defineAsyncComponent(decks[key])
</script>
