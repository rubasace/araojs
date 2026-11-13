# Images and backgrounds

Pictures are named from the images folder (`src/images`, subfolders allowed, case-sensitive),
never imported: `Img(file="team.jpg")` in a slide, `Slide(bg="team.jpg")` behind it. Every prop:
[Img](../reference/components.md#img) and [Slide](../reference/components.md#slide).

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

The background is a layer under the content, as big as the slide, that never catches the pointer.
`bg` is read in this order:

1. **URL**: starts with a scheme or `/` (`https://…`, `data:…`, `/from-public.jpg`). Root-relative
   paths are served under Vite's `base`.
2. **File**: a file in the images folder (`city.jpg`, `team/ana.png`, `"photo (1).jpg"`), or a
   name that looks like a file (ends in an extension) but is not there: shown as missing, with a
   warning.
3. **CSS**: anything else, as a CSS `background` (`"#1d2b4a"`, `"linear-gradient(…)"`).
   `url(…)` here is plain CSS, relative to the page, not processed by Vite: name the file instead.
   An invalid value warns in development.

A blank `bg` is no bg. `#background` slot: every element in it covers the whole slide, stacked in
order (a picture, then a tint over it); `v-step` works inside. With both, `bg` is drawn first and
the slot above it. With neither (a slot that renders nothing counts as none), the theme's default
background shows (`--ar-slide-bg-*`), and the `bg-*` props tune it. Headings inside the
background are not used as the slide's title.

```pug
Slide(layout="split" ratio="2 1")
  h2 Before and after
  template(#left)
    p Every team rolled its own.
  template(#right)
    p(v-step="2") One starter, one version.

Slide(layout="image-right" ratio="3 2")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side edge to edge.

Slide(bg="demo/city.svg" bg-opacity="0.25")
  h2 Built for the city

Slide(bg="linear-gradient(135deg, #1d2b4a, #0f1115)")
  h2 A gradient background

Slide
  template(#background)
    Img(file="demo/landscape.svg" blur="6")
    .veil
  h2 A softened background
```

(`.veil` is a class of the deck, e.g.
`.veil { background: color-mix(in srgb, var(--ar-bg) 70%, transparent); }`.)
