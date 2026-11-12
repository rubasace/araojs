#!/usr/bin/env node
// The command line of Arao, run in a slides project (its folder is the current directory):
//   arao export [options]   PDFs of the decks
// Each command is a module next to this one, given the arguments after its name.
const COMMANDS = { export: 'PDFs of the decks (arao export --help)' }
const HELP = `Usage: arao <command> [options]

${Object.entries(COMMANDS).map(([c, what]) => `  ${c.padEnd(10)} ${what}`).join('\n')}`

const command = process.argv[2]
if (command == null || command === '-h' || command === '--help') {
  console.log(HELP)
  process.exit(command == null ? 1 : 0)
}
if (!Object.hasOwn(COMMANDS, command)) {
  console.error(`arao: no command "${command}"\n\n${HELP}`)
  process.exit(1)
}
await import(`./${command}.js`)
