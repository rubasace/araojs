// What a project's shortcuts file sees of the package while the Vite plugin reads it in Node
// (vite/shortcuts.js): defineShortcuts, which returns the map as is (its types are the package's,
// src/core/shortcuts.ts).
/**
 * @template T
 * @param {T} map
 * @returns {T}
 */
export const defineShortcuts = (map) => map
