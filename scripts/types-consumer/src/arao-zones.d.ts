// A zone the project places on a library layout (a theme's .layout-image-right > .ar-zone-caption,
// say): declared for the type check as the docs say, image-right's own zone restated (an entry
// here replaces its zones)
export {}
declare module 'araojs' {
  interface ProjectLayoutZones {
    'image-right': {
      image: true
      /** the caption under the picture (the theme places it) */
      caption: true
    }
  }
}
