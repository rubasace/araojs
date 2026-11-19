// A zone the project places on a library layout (a theme's .layout-split > .ar-zone-caption, say):
// declared for the type check as the docs say, split's own zones restated (an entry here replaces
// them)
export {}
declare module 'araojs' {
  interface ProjectLayoutZones {
    split: {
      left: true
      right: true
      /** the caption under both sides (the theme places it) */
      caption: true
    }
  }
}
