# Images and backgrounds

Pictures are named from the images folder (`src/images`, subfolders allowed, case-sensitive),
never imported: `Img(file="team.jpg")` in a slide, `Background(src="team.jpg")` behind it. Every
prop: [Img](../reference/components.md#img) and [Background](../reference/components.md#background).

## Pictures: Img

Behaviour and gotchas:
- **No size of its own.** It fills the box its container gives it (the space under the title, a
  column, a cell, a zone, `Center`) and fits the picture inside. In a plain block it is as wide as
  the block and as tall as the picture's shape. For a fixed size, give it a class with width and
  height (or one of them and the other `auto`): `.avatar { flex: none; width: 320px; height: 320px; }`.
- A missing file (or a URL that fails) shows a dashed box with the file name (and the alt, if
  any), and one grouped warning in development.
- Every picture of the folder is fetched when the deck opens (all slides are in the page).
  Text, code, CSS and SVG stay sharp at any screen size (the canvas is scaled with a transform and
  re-rasterised), but photos are upscaled with it: for a 4K screen give a picture about twice its
  size in canvas px (a full-slide background ≈ 3840 px wide). Prefer WebP/AVIF/JPEG to keep the
  download small.
- Only `png`, `jpg`, `jpeg`, `gif`, `webp`, `avif`, `svg` are taken from the folder.

```pug
Cols
  Img(file="demo/landscape.svg")
  Img(file="demo/landscape.svg" fit="cover" rounded)
  Center
    Img.avatar(file="demo/city.svg" fit="cover" rounded="full")
```

## Backgrounds

A slide's background is a layer under its content, as big as the slide, that never catches the
pointer. Without anything of the slide's own, it shows the theme's default background, if the theme
sets one (`--ar-slide-bg-*`, [Theme tokens](../reference/theme-tokens.md#background-motion-addons)).

### A picture, a video, anything: Background

`Background`, anywhere inside a `Slide` (first is clearest), draws behind all of the slide's
content, edge to edge, instead of the theme's default background:

```pug
Slide
  Background(src="demo/city.svg" opacity="0.25")
  h2 Built for the city
```

- `src` is a URL when it starts with a scheme or `/` (`https://…`, `data:…`, `/from-public.jpg`,
  served under Vite's `base`), else a file of the images folder, as `Img(file)`: one that is not
  there shows as a dashed box with its name, and warns.
- `opacity` (`0`..`1`, over the slide's colour), `blur` (px), `position` (what stays in view when
  cropped, as CSS `object-position`), `fit` (`cover`, the default, or `contain`).
- Without `src`, what is inside it is the background: a video, an `svg`, a `div` with a gradient.
  Each element of it covers the whole slide, stacked in order (a picture, then a tint over it);
  `fit` and `position` apply to its pictures and videos, `opacity` and `blur` to all of it.
- Steps: `v-step` on it (`Background(v-step="2")`), on an element around it or inside it works as
  anywhere in the slide: the background fades in at that step.
- A class or a style on it goes on what it draws (`Background.dim(src="city.jpg")`), and the
  deck's scoped styles reach it. Several stack in order. Headings inside it are not the slide's
  title.

```pug
Slide
  Background
    Img(file="demo/landscape.svg" blur="6")
    .veil
  h2 A softened background

Slide
  Background
    video(src="/loop.mp4" autoplay muted loop)
  h2 A moving one
```

(`.veil` is a class of the deck, e.g.
`.veil { background: color-mix(in srgb, var(--ar-bg) 70%, transparent); }`.)

### A colour or a gradient: CSS

A plain colour or a gradient needs no component: it is CSS on the slide, a `style` or a class of
the deck. The theme's default background, if it has one, is drawn over it, as over every slide's
colour; `--ar-slide-bg-image: none` leaves it out on that slide:

```pug
Slide(style="background: linear-gradient(135deg, #1d2b4a, #0f1115); color: #fff; --ar-slide-bg-image: none")
  h2 A gradient background

Slide.night
  h2 A class of the deck
```

```css
.night { background: #0f1115; color: #e8e8ea; --ar-title-color: #fff; }
```
