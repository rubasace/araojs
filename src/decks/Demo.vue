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

  Slide(layout="split" ratio="2 1")
    h2 Layout split
    template(#left)
      p Dos zonas con nombre bajo el título: #[strong #left] y #[strong #right].
      p(v-step="2") #[strong ratio="2 1"] reparte el ancho: dos tercios y un tercio.
      p(v-step="3") El título es lo que va en el slot por defecto.
    template(#right)
      Card(title="#right" :items="['Pasos', 'en zonas']" :from="2")

  Slide(layout="image-left")
    template(#image)
      img(:src="landscape" alt="")
    h2 Layout image-left
    p La imagen llena su lado de borde a borde; el slot por defecto es el texto.
    p(v-step.collapse="2") Con .collapse, lo de debajo se recoloca deslizándose.
    p.muted Línea final.

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      img(:src="landscape" alt="")
    h2 Layout image-right
    p #[strong ratio="3 2"] va de izquierda a derecha: texto tres quintos, imagen dos.

  Slide
    h2 Cols
    Rows
      Cols
        .box Sin ratio:
        .box una columna
        .box por hijo
      Cols(ratio="72 28" align="center")
        .box ratio="72 28" · align="center"
        .box.tall(v-step="2") 28 %

  Slide
    h2 Rows y Grid
    Rows(ratio="auto 1")
      p.muted Rows(ratio="auto 1"): esta fila se ajusta al texto; Grid(cols="4") ocupa el resto.
      Grid(cols="4" gap="sm")
        .box(v-for="n in 2" :key="n") {{ n }}
        .box.accent(v-step.collapse="2") nuevo
        .box(v-for="n in 5" :key="n") {{ n + 2 }}

  Slide
    h2 Center
    Center
      p.upper Centrado en las dos direcciones
      p(v-step="2") …y los pasos siguen funcionando.
    p.center.small.muted Utilidades, solo como último recurso: .muted · .center · .upper · .small

  Slide(layout="section")
    h1 ¡Fin!
</template>

<script setup>
import Card from '../slides/Card.vue'
import landscape from './demo/landscape.svg'
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
</script>

<style scoped>
.box {
  display: flex; align-items: center; justify-content: center; text-align: center;
  padding: 24px 32px; border-radius: var(--ph-radius);
  background: color-mix(in srgb, var(--ph-fg) 8%, var(--ph-bg));
}
.box.tall { min-height: 260px; }
.box.accent { background: var(--ph-accent); color: var(--ph-accent-fg); }
</style>
