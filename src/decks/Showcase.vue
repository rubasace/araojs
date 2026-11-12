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
        p …y la ventana mantiene la forma 16:9 de la slide.
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

  Slide(title="Grid con forma")
    h2 Grid con forma: ratio="2:1"
    Grid(ratio="2:1" gap="md")
      .box(v-for="(t, i) in ['Logging', 'Metrics', 'Tracing', 'Clients', 'Errors']" :key="t" v-step="i + 1") {{ t }}
    Notes
      p Las columnas salen del número de elementos: 5 con forma 2:1 son 3 arriba y 2 centrados abajo.

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

  //- ---------------------------------------------------------------- grids
  //- the same shaped grid with a growing number of children
  Slide(v-for="n in [2, 3, 4, 5, 7, 9]" :key="'g21-' + n" :title="`Grid 2:1 · ${n} elementos`")
    h2 Grid ratio="2:1" · {{ n }} elementos
    Grid(ratio="2:1" gap="md")
      .box(v-for="i in n" :key="i") {{ i }}

  Slide(v-for="n in [4, 5, 6, 10]" :key="'g11-' + n" :title="`Grid 1:1 · ${n} elementos`")
    h2 Grid ratio="1:1" · {{ n }} elementos
    Grid(ratio="1:1" gap="sm")
      .box(v-for="i in n" :key="i") {{ i }}

  Slide(v-for="n in [4, 6, 7]" :key="'g41-' + n" :title="`Grid 4:1 · ${n} elementos`")
    h2 Grid ratio="4:1" · {{ n }} elementos
    Grid(ratio="4:1" gap="sm")
      .box(v-for="i in n" :key="i") {{ i }}

  Slide(title="Grid cols frente a ratio")
    h2 cols="3" frente a ratio="2:1", con 5
    Cols(gap="lg")
      Rows(ratio="auto 1" gap="sm")
        p.muted.center Grid(cols="3") — rellena por la izquierda
        Grid(cols="3" gap="sm")
          .box(v-for="i in 5" :key="i") {{ i }}
      Rows(ratio="auto 1" gap="sm")
        p.muted.center Grid(ratio="2:1") — última fila centrada
        Grid(ratio="2:1" gap="sm")
          .box(v-for="i in 5" :key="i") {{ i }}
    Notes
      p cols fija las columnas; ratio las calcula a partir del número de elementos y centra la última fila.

  Slide(title="Galería en Grid")
    h2 Galería: Grid con imágenes
    Grid(ratio="2:1" gap="md")
      figure.shot(v-for="(f, i) in gallery" :key="f.file" v-step="i + 1")
        Img(:file="f.file" fit="cover" rounded :alt="f.label")
        figcaption {{ f.label }}
    Notes
      p Cinco imágenes con forma 2:1: 3 arriba y 2 centradas, apareciendo una por paso.

  //- ---------------------------------------------------------------- pictures in layouts
  Slide(layout="image-left" ratio="2 3" title="image-left")
    template(#image)
      Img(file="demo/portrait.svg" alt="Retrato")
    h2 image-left, ratio="2 3"
    p La imagen ocupa dos quintos a la izquierda, de borde a borde.
    p(v-step="2") El texto ocupa el resto con el padding normal.

  Slide(title="Imagen en una columna")
    h2 Imagen en una columna
    Cols(ratio="1 2" gap="lg" align="center")
      Img(file="demo/shapes.svg" rounded alt="Formas")
      div
        p Cols(ratio="1 2"): la imagen en un tercio, dentro del padding de la slide.
        p(v-step="2") Img se ajusta a su columna sin recortar (fit="contain").

  Slide(title="Banner arriba")
    h2 Banner arriba, texto debajo
    Rows(ratio="1 auto" gap="md")
      Img(file="demo/waves.svg" fit="cover" rounded alt="Olas")
      Cols(gap="lg")
        p Rows(ratio="1 auto"): la imagen se queda con el alto libre.
        p(v-step="2") El texto, solo lo que necesita.

  Slide(title="Avatar redondo")
    h2 Avatar redondo y texto
    Cols(ratio="1 2" gap="lg" align="center")
      Center
        Img.avatar(file="demo/portrait.svg" fit="cover" position="center 30%" rounded="full" alt="Retrato")
      div
        h3 Rubén Pahíno
        p.muted Img(rounded="full") con un tamaño fijo por clase.
        p(v-step="2") Center lo centra en su columna.

  Slide(layout="split" ratio="3 2" title="split con imagen")
    h2 split con una imagen en una zona
    template(#left)
      ul
        li Zona izquierda con texto
        li(v-step="2") Zona derecha con una imagen
        li(v-step="3") El título va encima de las dos
    template(#right)
      Img(file="demo/city.svg" fit="cover" rounded alt="Ciudad")

  Slide(layout="image-right" ratio="1 1" bg="demo/waves.svg" bg-opacity="0.15" title="Todo junto")
    template(#image)
      Img(file="demo/shapes.svg" fit="cover" alt="Formas")
    h2 Fondo, zona e imagen
    p image-right con un fondo suave en la slide entera.
    Grid(ratio="2:1" gap="sm" v-step="2")
      .box(v-for="t in ['bg', 'zona', 'Grid']" :key="t") {{ t }}

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

  Slide(title="Resumen de layouts")
    h2 Resumen de layouts
    Grid(ratio="4:1" gap="sm")
      .lay(v-for="l in layouts" :key="l.code")
        .mini(:class="'mini-' + l.kind")
          i(v-for="k in l.parts" :key="k")
        code {{ l.code }}
    Notes
      p Arriba los layouts de slide (prop layout); abajo las piezas para componer dentro de cualquier slide o zona.

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

const gallery = [
  { file: 'demo/landscape.svg', label: 'Paisaje' },
  { file: 'demo/city.svg', label: 'Ciudad' },
  { file: 'demo/shapes.svg', label: 'Formas' },
  { file: 'demo/waves.svg', label: 'Olas' },
  { file: 'demo/portrait.svg', label: 'Retrato' },
]

// summary slide: one card per layout, with a tiny diagram (parts = boxes drawn by .mini-<kind>)
const layouts = [
  { kind: 'default', parts: 2, code: 'Slide' },
  { kind: 'cover', parts: 2, code: 'layout="cover"' },
  { kind: 'section', parts: 1, code: 'layout="section"' },
  { kind: 'split', parts: 3, code: 'layout="split"' },
  { kind: 'image-left', parts: 2, code: 'layout="image-left"' },
  { kind: 'image-right', parts: 2, code: 'layout="image-right"' },
  { kind: 'bg', parts: 2, code: 'Slide(bg="…")' },
  { kind: 'cols', parts: 2, code: 'Cols(ratio="2 1")' },
  { kind: 'rows', parts: 2, code: 'Rows(ratio="auto 1")' },
  { kind: 'grid', parts: 6, code: 'Grid(cols="3")' },
  { kind: 'gridr', parts: 5, code: 'Grid(ratio="2:1")' },
  { kind: 'center', parts: 1, code: 'Center' },
]
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
.shot { margin: 0; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.shot figcaption { text-align: center; font-size: 28px; color: var(--ph-muted); }
.avatar { flex: none; width: 360px; height: 360px; }
.lay { display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center; min-height: 0; }
.lay code { font: 22px var(--ph-font-mono); color: var(--ph-muted); }
/* tiny diagrams: a 16:9 frame; the i elements are its boxes */
.mini {
  position: relative; width: 240px; aspect-ratio: 16 / 9; box-sizing: border-box;
  border: 3px solid color-mix(in srgb, var(--ph-fg) 35%, transparent); border-radius: 10px;
  padding: 12px; display: grid; gap: 8px;
}
.mini i { background: color-mix(in srgb, var(--ph-fg) 22%, transparent); border-radius: 4px; }
.mini i:first-child { background: var(--ph-accent); }
.mini-default { grid-template-rows: 14px 1fr; }
.mini-cover { align-content: center; grid-template-rows: 18px 10px; grid-template-columns: 60%; }
.mini-section { background: var(--ph-accent); place-items: center; }
.mini-section i { width: 50%; height: 18px; background: var(--ph-accent-fg) !important; }
.mini-split { grid-template-rows: 14px 1fr; grid-template-columns: 1fr 1fr; }
.mini-split i:first-child { grid-column: 1 / -1; }
.mini-image-left, .mini-image-right { padding: 0; grid-template-columns: 2fr 3fr; }
.mini-image-right { grid-template-columns: 3fr 2fr; }
.mini-image-left i:first-child, .mini-image-right i:last-child { background: var(--ph-accent); border-radius: 0; }
.mini-image-right i:first-child { background: color-mix(in srgb, var(--ph-fg) 22%, transparent); margin: 12px; }
.mini-image-left i:last-child { margin: 12px; }
.mini-bg { grid-template-rows: 14px 1fr; background: linear-gradient(135deg, color-mix(in srgb, var(--ph-accent) 35%, transparent), transparent); }
.mini-cols { grid-template-columns: 2fr 1fr; }
.mini-rows { grid-template-rows: 18px 1fr; }
.mini-grid { grid-template-columns: repeat(3, 1fr); }
.mini-gridr { grid-template-columns: repeat(6, 1fr); }
.mini-gridr i { grid-column: span 2; }
.mini-gridr i:nth-child(4) { grid-column: 2 / span 2; }
.mini-center { place-items: center; }
.mini-center i { width: 40%; height: 40%; }
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
