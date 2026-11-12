<!-- Its content centred both ways, text too. A composition piece: like Cols, Rows and Grid, it
     fills the free space of its container (the rest of the slide under its title, a zone, a cell of
     another piece) and takes v-step like any element.
       Center
         Icon(name="lucide:rocket" size="120")
         p Getting started -->
<template>
  <div class="ar-center"><slot /></div>
</template>

<script setup>
defineOptions({ name: 'Center' })
</script>

<style>
/* fills the free space of its container, its content in a centred column */
.ar-center {
  box-sizing: border-box; flex: 1 1 auto; min-width: 0; min-height: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
</style>
