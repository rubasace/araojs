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
  export const themeSources: string[]
}
declare module 'virtual:arao/shortcuts' {
  export const shortcuts: Readonly<Record<string, import('./core/shortcuts').Command>>
}
declare module 'virtual:arao/layout-tokens' {
  // by layout, the <thing> of each of its parameters, --ar-layout-<layout>-<thing> (vite/layout-params.js)
  export const layoutTokens: Readonly<Record<string, readonly string[]>>
  // by layout, then by <thing>, what a parameter whose doc block lists its values takes: its
  // words, its ranges of numbers ([from, to]), and that in words (vite/layout-docs.js)
  export const layoutValues: Readonly<Record<string, Readonly<Record<string, {
    readonly words: readonly string[]
    readonly ranges: readonly (readonly [number, number])[]
    readonly takes: string
  }>>>>
}
declare module 'virtual:arao/layout-styles'
declare module 'virtual:arao/theme-styles'
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
