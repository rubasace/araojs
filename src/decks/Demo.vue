<template lang="pug">
Deck(:themes="['default', 'vigojug']")
  ProgressBar(position="bottom")
  SlideNumber

  Slide(layout="cover")
    .bar
    h1 Phoenyx
    p.muted Prueba de concepto del motor · pulsa → para avanzar, f pantalla completa, t cambia tema

  Slide
    h2 Pasos dentro de la propia slide
    p(v-step="1") Esto se ve desde el principio (paso 1).
    p(v-step="2") Esto aparece en el paso 2.
    p(v-step="3") Y esto en el paso 3: la slide sabe sola que tiene 3 pasos.

  Slide(layout="two-cols")
    h2 Pasos en componentes anidados
    .cols
      Card(title="Card A" :items="['Uno', 'Dos', 'Tres']" :from="2")
      Card(title="Card B" :items="['Cuatro', 'Cinco']" :from="5")

  Slide
    h2 v-step.only
    p Visible siempre.
    p(v-step.only="2") Solo en el paso 2…
    p(v-step.only="3") …y esto solo en el 3.

  Slide(layout="two-cols")
    h2 Ocupar sitio o no
    .cols
      div
        p.muted v-step.only (reserva su sitio)
        p Visible siempre.
        p(v-step.only="2") Solo en el paso 2…
        p(v-step.only="3") …y esto solo en el 3.
        p Línea final: no se mueve.
      div
        p.muted v-step.only.collapse (no ocupa)
        p Visible siempre.
        p(v-step.only.collapse="2") Solo en el paso 2…
        p(v-step.only.collapse="3") …y esto solo en el 3.
        p Línea final: se recoloca.

  Slide(layout="section")
    h1 ¡Fin!
</template>

<script setup>
import Card from '../slides/Card.vue'
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
</script>
