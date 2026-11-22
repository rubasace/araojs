// Type-checks a TypeScript project against a packed araojs, under the module resolutions
// consumers use (bundler, as Vite's templates; nodenext), with skipLibCheck off: the published
// types must resolve and be strict (read-only refs, typed global components in templates, the
// layouts Slide's layout accepts: the library's and the project's, and the parameters each takes
// as Slide's attributes, no other layout's: checked with vueCompilerOptions.checkUnknownProps, as
// any unknown prop is; and the named templates each takes, its zones, no other layout's, those of
// any of several for a layout that may be one of them, and a zone the project declares on a
// library layout, src/arao-zones.d.ts), in HTML
// templates (Probe.vue) and in Pug ones (ProbePug.vue, through @vue/language-plugin-pug, the
// version of vue-tsc's).
//   node scripts/types-consumer.mjs <araojs-x.y.z.tgz>
// The project is scripts/types-consumer/, copied to a temporary folder with the tarball and the
// type checkers installed. First a vite build with the plugin (its vite.config.js), which must
// write src/arao-layouts.d.ts from its src/layouts, and warn about the token of one that is no
// attribute and about a doc block that lists a JSDoc type ({string}) as values; then the type
// checks, which include it.
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const tarball = process.argv[2]
if (!tarball) {
  console.error('usage: node scripts/types-consumer.mjs <araojs-x.y.z.tgz>')
  process.exit(2)
}
const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse((await import('node:fs')).readFileSync(join(here, '..', 'package.json'), 'utf8'))
const dir = mkdtempSync(join(tmpdir(), 'arao-types-'))
const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'inherit' })
let failed = false
try {
  cpSync(join(here, 'types-consumer'), dir, { recursive: true })
  const dev = ['typescript', 'vue-tsc', 'vue', 'vite', '@types/node'].map((n) => `${n}@${pkg.devDependencies[n]}`)
  // Volar's Pug plugin is released with vue-tsc, under the same version
  dev.push(`@vue/language-plugin-pug@${pkg.devDependencies['vue-tsc']}`)
  run('npm', ['install', '--no-audit', '--no-fund', '--silent', resolve(tarball), ...dev])
  // its output read: callout.css's --ar-layout-callout-title is no parameter (title is an HTML
  // attribute), which the plugin says
  const built = spawnSync('npx', ['vite', 'build'], { cwd: dir, encoding: 'utf8' })
  process.stdout.write(built.stdout)
  process.stderr.write(built.stderr)
  if (built.status !== 0) throw new Error(`vite build exited with ${built.status}`)
  if (!existsSync(join(dir, 'src/arao-layouts.d.ts'))) {
    console.error('types-consumer: vite build wrote no src/arao-layouts.d.ts')
    failed = true
  }
  if (!/\[arao\] src\/layouts\/callout\.css: @param size \{string\}: string is a type, no value/.test(built.stdout + built.stderr)) {
    console.error('types-consumer: vite build did not warn that callout.css\'s @param size {string} lists no values (a JSDoc type)')
    failed = true
  }
  if (!/\[arao\] src\/layouts\/callout\.css: --ar-layout-callout-title is no attribute of Slide/.test(built.stdout + built.stderr)) {
    console.error('types-consumer: vite build did not warn that --ar-layout-callout-title (src/layouts/callout.css) is no attribute')
    failed = true
  }
  for (const mode of ['bundler', 'nodenext']) {
    try {
      run('npx', ['vue-tsc', '-p', `tsconfig.${mode}.json`])
      console.log(`types-consumer: ${mode} ok`)
    } catch {
      console.error(`types-consumer: ${mode} FAILED`)
      failed = true
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
process.exit(failed ? 1 : 0)
