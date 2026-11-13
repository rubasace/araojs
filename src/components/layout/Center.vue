<!-- Its content centred both ways, text too. A composition piece: like Cols, Rows and Grid, it
     fills the free space of its container (the rest of the slide under its title, a zone, a cell of
     another piece) and takes v-step like any element.
       Center
         Icon(name="lucide:rocket" size="120")
         p Getting started
     CSS: what every piece shares is in layout.css; its own rule is below. -->
<template>
  <div class="ar-center"><slot /></div>
</template>

<script setup>
defineOptions({ name: 'Center' })
</script>

<style src="./layout.css"></style>
<style>
/* its content in a centred column */
.ar-center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
</style>
