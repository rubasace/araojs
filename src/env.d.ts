// The virtual modules the Vite plugin (vite/index.js) gives the engine, and the shapes they have.
declare module 'virtual:arao/decks' {
  import type { Component } from 'vue'
  export const decks: Record<string, () => Promise<{ default: Component }>>
  export const decksDir: string
}
declare module 'virtual:arao/snippets' {
  export const snippets: Record<string, () => Promise<string>>
}
declare module 'virtual:arao/icons' {
  export const icons: Record<string, { body: string; width: number; height: number }>
}
declare module 'virtual:arao/images' {
  export const images: Record<string, string>
  export const imagesDir: string
}
declare module 'virtual:arao/themes' {
  export const themes: string[]
  export const themesDir: string
}
declare module 'virtual:arao/theme-styles'
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
