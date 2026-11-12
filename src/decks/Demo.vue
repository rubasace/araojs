<template lang="pug">
Deck(:themes="['default', 'vigojug']" duration="10m")
  ProgressBar(position="bottom")
  SlideNumber

  Slide(layout="cover")
    .bar
    h1 Phoenyx
    p.muted Prueba de concepto del motor · pulsa → para avanzar, f pantalla completa, t cambia tema
    Notes
      p Demo del motor: cada slide enseña una pieza.
      p Teclas: → avanza, #[strong f] pantalla completa, #[strong t] cambia el tema, #[strong p] abre esta vista.

  Slide
    h2 Pasos dentro de la propia slide
    p(v-step="1") Esto se ve desde el principio (paso 1).
    p(v-step="2") Esto aparece en el paso 2.
    p(v-step="3") Y esto en el paso 3: la slide sabe sola que tiene 3 pasos.
    Notes
      p Nadie declara cuántos pasos tiene la slide: es el mayor de sus v-step.
    Notes(step="2")
      p Paso 2: aparece el segundo párrafo.
    Notes(step="3")
      p Paso 3: el último; la siguiente pulsación pasa de slide.

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
    Notes
      p #[code v-step.only="n"]: visible solo en el paso n, no desde él.

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
      Img(file="demo/landscape.svg")
    h2 Layout image-left
    p La imagen llena su lado de borde a borde; el slot por defecto es el texto.
    p(v-step.collapse="2") Con .collapse, lo de debajo se recoloca deslizándose.
    p.muted Línea final.

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      Img(file="demo/landscape.svg")
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

  Slide
    h2 Img
    Cols
      Rows(ratio="1 auto" gap="sm")
        Img(file="demo/landscape.svg")
        p.small.muted.center fit="contain" (por defecto)
      Rows(ratio="1 auto" gap="sm")
        Img(file="demo/landscape.svg" fit="cover" rounded)
        p.small.muted.center fit="cover" rounded
      Rows(ratio="1 auto" gap="sm")
        Center
          Img.avatar(file="demo/city.svg" fit="cover" rounded="full" v-step="2")
        p.small.muted.center(v-step="2") rounded="full"
    p.small.muted Archivos de src/images por nombre: #[strong Img(file="demo/landscape.svg")]. Sin tamaño propio: ocupa la caja que le da su contenedor, o la que le dé una clase.

  Slide(bg="demo/city.svg" bg-opacity="0.2")
    h2 Fondo: bg
    p #[strong bg="demo/city.svg"] pone una imagen detrás del contenido, en toda la slide.
    p(v-step="2") #[strong bg-opacity="0.2"] la funde con el fondo del tema, y el texto se sigue leyendo.
    p(v-step="3") También #[strong bg-position], #[strong bg-blur] y #[strong bg-fit]; y bg acepta un color o un degradado.

  Slide
    template(#background)
      Img(file="demo/landscape.svg" blur="8")
      Img(v-step="2" file="demo/city.svg")
      .tint
    h2 Fondo: template(#background)
    p Cada elemento del slot cubre la slide, apilados en orden: una imagen desenfocada y un velo encima.
    p(v-step="2") v-step también funciona ahí: la ciudad aparece en el paso 2.

  Slide
    h2 Notas del presentador
    p #[strong Notes] dentro de una Slide: no se pinta, no ocupa sitio, no añade pasos.
    p(v-step="2") #[strong Notes(step="2")] se ve desde ese paso, como v-step.
    p(v-step="3") Pulsa #[strong p] (o abre la URL con #[strong ?presenter]): slide actual, siguiente paso, notas, hora y tiempo.
    Notes
      p Estas notas solo se ven en la vista del presentador.
      ul
        li Contenido libre: #[strong negrita], listas, #[code código].
    Notes(step="2")
      p Esta nota aparece en el paso 2 y va marcada mientras ese sea el paso en pantalla.
    Notes(step="3")
      p Las dos ventanas van a la par: avanza en cualquiera y la otra la sigue; el tema también.
      p Con #[code Deck(duration="10m")] el tiempo cuenta hacia atrás: ámbar al final, rojo si te pasas.

  Slide(layout="section")
    h1 ¡Fin!
</template>

<script setup>
import Card from '../slides/Card.vue'
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
.avatar { flex: none; width: 320px; height: 320px; }
/* a veil of the theme's background colour, solid behind the text, lighter to the right */
.tint { background: linear-gradient(90deg, color-mix(in srgb, var(--ph-bg) 92%, transparent) 40%, color-mix(in srgb, var(--ph-bg) 35%, transparent)); }
</style>
