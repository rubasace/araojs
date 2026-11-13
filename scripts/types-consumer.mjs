// Type-checks a TypeScript project against a packed araojs, under the module resolutions
// consumers use (bundler, as Vite's templates; nodenext), with skipLibCheck off: the published
// types must resolve and be strict (read-only refs, typed global components in templates).
//   node scripts/types-consumer.mjs <araojs-x.y.z.tgz>
// The project is scripts/types-consumer/, copied to a temporary folder with the tarball and the
// type checkers installed.
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

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
  run('npm', ['install', '--no-audit', '--no-fund', '--silent', resolve(tarball), ...dev])
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
