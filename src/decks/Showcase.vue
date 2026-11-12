<!-- A tour of everything the v2 engine supports today, one feature per slide. -->
<template lang="pug">
Deck(:themes="['default', 'vigojug']" duration="15m")
  ProgressBar
  SlideNumber

  //- ---------------------------------------------------------------- intro
  Slide(layout="cover" title="Phoenyx v2")
    .bar
    h1 Phoenyx v2
    p.muted Lo que soporta hoy el motor · → para avanzar · p abre la vista de presentador
    Notes
      p Bienvenida. Todo lo que vas a ver está hecho con el propio motor.
      p Pulsa p para abrir la vista de presentador en otra ventana: se sincronizan solas.

  Slide(title="Un lienzo fijo")
    h2 Un lienzo fijo de 1920×1080
    Cols(ratio="3 2" align="center")
      div
        p El deck se pinta siempre a 1920×1080 y se escala entero.
        p(v-step="2") Cambia el tamaño de la ventana: el texto no se mueve de sitio.
        p(v-step="3") Lo mismo en el portátil, en el proyector y en el PDF.
      Center
        .frame 16 : 9
    Notes
      p El motor de aspect ratio era el punto fuerte del framework antiguo; ahora es un lienzo escalado con transform.

  //- ---------------------------------------------------------------- steps
  Slide(layout="section")
    h1 Pasos

  Slide(title="v-step")
    h2 v-step: el número es el paso
    ul
      li Esto se ve al llegar (paso 1)
      li(v-step="2") Esto en el paso 2
      li(v-step="3") Y esto en el 3
      li(v-step="5") Un 5 a propósito deja un paso vacío
    Notes
      p La slide cuenta sola sus pasos: el máximo de todos los v-step que tenga dentro.
      p Por defecto lo oculto guarda su sitio, así que nada salta.

  Slide(title="only y collapse")
    h2 .only y .collapse
    Cols(gap="lg")
      div
        p.muted v-step.only — guarda su sitio
        p Visible siempre
        p(v-step.only="2") Solo en el paso 2…
        p(v-step.only="3") …y solo en el 3
        p Línea final: no se mueve
      div
        p.muted v-step.only.collapse — no ocupa
        p Visible siempre
        p(v-step.only.collapse="2") Solo en el paso 2…
        p(v-step.only.collapse="3") …y solo en el 3
        p Línea final: se desliza a su sitio
    Notes
      p A la derecha, lo que aparece empuja al resto con una animación suave en lugar de un salto.

  Slide(title="Pasos en componentes anidados")
    h2 Pasos dentro de componentes
    Cols
      Card(title="Card A" :items="['Uno', 'Dos', 'Tres']" v-step-from="2")
      Card(title="Card B" :items="['Cuatro', 'Cinco']" v-step-from="5")
    Notes
      p Card numera sus pasos desde 1 y no sabe dónde está; v-step-from la coloca en el paso 2 o en el 5. La slide sabe que tiene 6 pasos.

  Slide(title="Animaciones reutilizables")
    h2 Animaciones reutilizables
    Cols(ratio="2 3" align="center" gap="lg")
      div
        p Cada componente numera sus pasos desde 1.
        p(v-step="2") v-step-from lo coloca en el paso que quieras.
        p(v-step="3") Funciona igual con v-step y con useSlide().
      Snippet(v-step-from="3" file="LoggingFilter.java" fit :highlights='{ "2:implements+++Filter": 2, "4-7": 3 }')
    Notes
      p El snippet tiene sus resaltados en los pasos 2 y 3; con v-step-from="3" salen en los pasos 4 y 5 de la slide.

  //- ---------------------------------------------------------------- code
  Slide(layout="section")
    h1 Código

  Slide(title="Snippet · LoggingFilter.java")
    h2 Snippet desde fichero
    Snippet(file="LoggingFilter.java" :highlights='{ "2:implements+++Filter": 2, "4-7": 3, "8-10": 4 }')
    Notes
      p Solo el nombre del fichero: el lenguaje sale de la extensión y el título del nombre.
      p Notes(step) permite una nota por paso del snippet.
    Notes(step="2")
      p Paso 2: resaltado de palabras dentro de una línea.
    Notes(step="3")
      p Paso 3: un bloque de líneas; el resto se atenúa.

  Slide(title="Snippet · mismo marco")
    h2 Siempre el mismo marco
    Snippet(file="ApplicationImportingConfiguration.java" name="ApplicationConfiguration.java")
    Notes
      p La ventana tiene el mismo tamaño en todas las slides; solo cambia el código. La letra solo se reduce si no cabe.

  Slide(title="Snippet en línea")
    h2 Snippets pequeños junto al texto
    Cols(ratio="1 1" align="center")
      div
        p Con fit la ventana se ajusta al código.
        p(v-step="2") Y el tema del deck decide los colores: pulsa t.
      Snippet(code="npm install\nnpm run dev\nnpm run export -- --deck showcase" lang="bash" name="terminal" fit :line-numbers="false")
    Notes
      p El tema vigojug cambia también el tema de Shiki a uno claro.

  Slide(title="Sin fit, solo con Cols")
    h2 Lo mismo sin fit: solo Cols
    Cols(ratio="1 1" align="center")
      div
        p Sin fit, la columna limita el ancho…
        p …pero la ventana ocupa todo el alto disponible.
      Snippet(code="npm install\nnpm run dev\nnpm run export -- --deck showcase" lang="bash" name="terminal" :line-numbers="false")
    Notes
      p Comparación con la slide anterior: mismo contenido y mismas columnas, sin fit.

  //- ---------------------------------------------------------------- layout
  Slide(layout="section")
    h1 Layout

  Slide(layout="split" ratio="1 1" title="split")
    h2 Layout split
    template(#left)
      h3 Antes
      p.muted Cada slide con su CSS para colocar cosas.
    template(#right)
      h3(v-step="2") Ahora
      p(v-step="2") Zonas con nombre y una proporción.
    Notes
      p Slide(layout="split" ratio="1 1") con template #left y #right.

  Slide(layout="image-right" ratio="3 2" title="image-right")
    template(#image)
      Img(file="demo/landscape.svg" alt="Paisaje")
    h2 Imagen a un lado
    p La imagen llena su lado de borde a borde.
    Snippet(v-step="2" file="showcase/image-right.pug" name="Showcase.vue" fit :size="30" :highlights='{ "1": 3, "2-3": 4 }')
    Notes
      p image-left e image-right; las imágenes se cargan por nombre desde src/images.

  Slide(title="Cols, Grid, Center")
    h2 Piezas para componer
    Rows(ratio="auto 1" gap="md")
      Cols(ratio="2 1" gap="md")
        .box Cols ratio="2 1"
        .box Un tercio
      Grid(cols="4" gap="sm")
        .box(v-for="n in 8" :key="n" v-step="n <= 4 ? 1 : 2") {{ n }}
    Notes
      p Cols, Rows, Grid y Center: proporciones y espacios por props, sin escribir CSS de colocación.

  //- ---------------------------------------------------------------- images
  Slide(bg="demo/city.svg" bg-opacity="0.3" title="Fondos")
    h2 Fondos por capas
    p Una imagen de fondo con su opacidad: bg y bg-opacity.
    p(v-step="2") Fondo, contenido y addons van en capas separadas.
    Notes
      p También acepta un color o un degradado, bg-position y bg-blur.

  Slide(title="Fondo libre")
    template(#background)
      Img(file="demo/landscape.svg" fit="cover" :opacity="0.35")
      .tint
    h2 Fondo con lo que quieras
    p El slot #background admite varias capas: aquí una imagen y un degradado encima.
    Notes
      p Lo que va en #background no captura el ratón ni cuenta como título.

  //- ---------------------------------------------------------------- deck
  Slide(layout="section")
    h1 Presentar

  Slide(title="Controles")
    h2 Controles
    Grid(cols="2" gap="md")
      .key-row
        kbd → / espacio
        span Avanzar paso o slide
      .key-row
        kbd g · 1…9
        span Saltar a una slide
      .key-row
        kbd t
        span Cambiar de tema
      .key-row
        kbd f
        span Pantalla completa
      .key-row
        kbd p
        span Vista de presentador
      .key-row
        kbd ratón
        span Panel; el cursor se oculta solo
    Notes
      p La URL lleva slide y paso (#/slide/paso), así que se puede enlazar a cualquier punto.

  Slide(title="Vista de presentador")
    h2 Vista de presentador
    ul
      li Slide actual y el paso siguiente tal como lo verá el público
      li(v-step="2") Notas por slide y por paso
      li(v-step="3") Hora, cronómetro y cuenta atrás con Deck(duration)
      li(v-step="4") Ventanas sincronizadas en los dos sentidos
    Notes
      p Este deck tiene duration="15m": en los últimos minutos el tiempo se pone ámbar y, si te pasas, rojo.
    Notes(step="4")
      p Prueba a avanzar desde esta ventana: la del público se mueve sola.

  Slide(title="Exportar")
    h2 Exportar a PDF
    Snippet(code="npm run export -- --deck showcase\nnpm run export -- --deck showcase --per-step --notes" lang="bash" name="terminal" fit :line-numbers="false")
    p(v-step="2").center Texto vectorial, una página por slide o por paso, con o sin notas.
    Notes
      p Usa Chromium headless sobre una build, no hace falta el servidor de desarrollo.

  Slide(layout="cover" title="Fin")
    .bar
    h1 ¡Eso es todo!
    p.muted PR #9 · rama v2-engine · docs/reference.md y AGENTS.md
    Notes
      p Gracias.
</template>

<script setup>
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
import Card from '../slides/Card.vue'
</script>

<style scoped>
.frame {
  width: 480px; height: 270px;
  display: grid; place-items: center;
  border: 4px solid var(--ph-accent); border-radius: var(--ph-radius);
  color: var(--ph-accent); font-size: 64px; font-weight: 700;
}
.box {
  display: grid; place-items: center;
  min-height: 120px;
  border-radius: var(--ph-radius);
  background: color-mix(in srgb, var(--ph-fg) 8%, var(--ph-bg));
  border-left: 8px solid var(--ph-accent);
  font-size: 36px;
}
.tint {
  background: linear-gradient(90deg, var(--ph-bg) 30%, transparent);
}
.key-row { display: flex; align-items: center; gap: 32px; }
kbd {
  flex: none; min-width: 240px; padding: 12px 20px;
  border-radius: 12px; text-align: center;
  font: 600 32px var(--ph-font-mono);
  background: color-mix(in srgb, var(--ph-fg) 10%, var(--ph-bg));
  border: 2px solid color-mix(in srgb, var(--ph-fg) 20%, transparent);
}
</style>
