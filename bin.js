#!/usr/bin/env node
const process = require('process')
const { command, arg, flag, summary } = require('paparam')
const pkg = require('./package')
const oidc = require('.')

const setup = command(
  'setup',
  summary('Set up OIDC publishing for a package'),
  arg('[entry]', 'The path to the package'),
  flag('--environment <name>', 'The deployment environment name').default('npm'),
  flag('--workflow <file>', 'The workflow file name').default('publish.yml'),
  flag('--reviewer <specifier>', 'The team: or user: that should act as reviewer').multiple(),
  async (cmd) => {
    const { entry = '.' } = cmd.args
    const { environment, workflow, reviewer: reviewers = [] } = cmd.flags

    try {
      await oidc.setup(entry, { environment, workflow, reviewers })
    } catch (err) {
      console.error(err)
      process.exitCode = 1
    }
  }
)

const cmd = command(
  pkg.name,
  summary(pkg.description),
  flag('--version|-v', 'Print the current version'),
  setup,
  async (cmd) => {
    const { version } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    console.log(cmd.command.help())
  }
)

cmd.parse()
