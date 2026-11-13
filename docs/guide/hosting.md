# Hosting

A deck's path is the app's own page under another URL: whatever serves the site must answer
`/framework` with `index.html`.

- `npm run dev` and `vite preview` do (Vite's SPA fallback), under any `base`.
- `vite build` writes `dist/404.html`, a copy of `dist/index.html` (from the `arao()` plugin):
  GitHub Pages, and every static host that serves `404.html` for a path it has no file for,
  answer a deck's path with the app, which opens the deck (with HTTP status 404, which browsers
  ignore and crawlers do not). A `404.html` of the project's own in `public/` is kept instead.
- Elsewhere, have the server fall back to `index.html` (nginx: `try_files $uri $uri/ /index.html;`;
  Netlify: `/* /index.html 200` in `_redirects`).
- Under a sub-path, build with that `base` (GitHub Pages of `user/talks`: `base: '/talks/'`).
- A deck cannot be named like a file or folder at the site's root (`assets`, a file of
  `public/`): the server answers that path with the file.

The paths themselves, and how they work under a base: [URLs](../reference/urls.md).
