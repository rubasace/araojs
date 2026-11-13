// The docs site: VitePress on docs/ itself, the same Markdown that reads on GitHub and in
// node_modules/araojs/docs. npm run docs:dev / docs:build (into docs/.vitepress/dist, with llms.txt).
import { posix } from 'node:path'
import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

const REPO = 'https://github.com/rubasace/araojs'

// A relative link to something that is no page of the site (a file outside docs/, such as
// ../AGENTS.md, or a file of docs/ that is not Markdown, such as examples/grid.vue) points to
// the repository on GitHub instead, so that the same Markdown works on GitHub and here.
function repoLinks(md) {
  md.core.ruler.push('arao-repo-links', (state) => {
    const page = state.env.relativePath ?? ''
    for (const block of state.tokens) {
      for (const token of block.children ?? []) {
        if (token.type !== 'link_open') continue
        const href = token.attrGet('href')
        if (!href || /^([a-z]+:|#|\/)/i.test(href)) continue
        const [path, hash] = href.split('#')
        const target = posix.normalize(posix.join(posix.dirname(page), path))
        if (!target.startsWith('../') && path.endsWith('.md')) continue
        const inRepo = posix.normalize(posix.join('docs', target))
        const kind = path.endsWith('/') ? 'tree' : 'blob'
        token.attrSet('href', `${REPO}/${kind}/main/${inRepo}${hash ? `#${hash}` : ''}`)
      }
    }
  })
}

const guide = [
  ['Concepts', 'concepts'],
  ['The project', 'project'],
  ['Slides and layouts', 'slides-and-layouts'],
  ['Steps', 'steps'],
  ['Composition', 'composition'],
  ['Code', 'code'],
  ['Images and backgrounds', 'images-and-backgrounds'],
  ['Icons', 'icons'],
  ['Presenting', 'presenting'],
  ['Themes', 'themes'],
  ['Export to PDF', 'export'],
  ['Hosting', 'hosting'],
  ['Extending', 'extending'],
]
const reference = [
  ['Components', 'components'],
  ['Directives', 'directives'],
  ['Composables', 'composables'],
  ['Theme tokens', 'theme-tokens'],
  ['Vite plugin', 'vite-plugin'],
  ['CLI', 'cli'],
  ['URLs', 'urls'],
]
const items = (dir, list) => list.map(([text, page]) => ({ text, link: `/${dir}/${page}` }))

export default defineConfig({
  title: 'Arao',
  description: 'Slides as Vue components: one canvas, every screen.',
  base: process.env.DOCS_BASE || '/araojs/',
  cleanUrls: true,
  lastUpdated: false,
  markdown: { config: repoLinks },
  vite: { plugins: [llmstxt()] },
  themeConfig: {
    nav: [
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Guide', link: '/guide/concepts' },
      { text: 'Reference', link: '/reference/components' },
    ],
    sidebar: [
      { text: 'Introduction', items: [{ text: 'Overview', link: '/' }, { text: 'Getting started', link: '/getting-started' }] },
      { text: 'Guide', items: items('guide', guide) },
      { text: 'Reference', items: items('reference', reference) },
      { text: 'Contributors', collapsed: true, items: [{ text: 'Architecture', link: '/architecture' }] },
    ],
    socialLinks: [{ icon: 'github', link: REPO }],
    search: { provider: 'local' },
    outline: [2, 3],
    editLink: { pattern: `${REPO}/edit/main/docs/:path` },
  },
})
