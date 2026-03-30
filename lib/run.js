const { spawn } = require('child_process')

module.exports = async function run(command, args, opts = {}) {
  const { input = null, ...spawnOpts } = opts

  const job = spawn(command, args, spawnOpts)
  const out = []
  const err = []

  job.stdout.on('data', (data) => out.push(data))
  job.stderr.on('data', (data) => err.push(data))

  if (input !== null) job.stdin.end(input)

  return new Promise((resolve, reject) => {
    job.on('close', (code) => {
      if (code === null || code !== 0) {
        return reject(
          new Error(`Command '${command} ${args.join(' ')}' failed`, {
            cause: Buffer.concat(err).toString().trim()
          })
        )
      }

      resolve(Buffer.concat(out).toString().trim())
    })
  })
}
