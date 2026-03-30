const path = require('path')
const run = require('./run')

module.exports = async function setup(base, opts = {}) {
  if (typeof base === 'object' && base !== null) {
    opts = base
    base = '.'
  }

  const { environment = 'npm', workflow = 'publish.yml', reviewers = null } = opts

  const pkg = require(path.resolve(base, 'package.json'))

  const repo = parseRepository(pkg)

  const body = {
    deployment_branch_policy: {
      protected_branches: false,
      custom_branch_policies: true
    }
  }

  if (reviewers && reviewers.length > 0) {
    const org = repo.split('/')[0]

    body.reviewers = await Promise.all(
      reviewers.map(async (reviewer) => {
        const i = reviewer.indexOf(':')

        if (i === -1) {
          throw new Error(
            `Invalid reviewer format '${reviewer}', expected 'team:<slug>' or 'user:<login>'`
          )
        }

        const type = reviewer.slice(0, i)
        const name = reviewer.slice(i + 1)

        switch (type) {
          case 'team':
            return { type: 'Team', id: await getTeamID(org, name) }
          case 'user':
            return { type: 'User', id: await getUserID(name) }
          default:
            throw new Error(`Unknown reviewer type '${type}', expected 'team' or 'user'`)
        }
      })
    )
  }

  await run(
    'gh',
    [
      'api',
      '--method',
      'PUT',
      `repos/${repo}/environments/${encodeURIComponent(environment)}`,
      '--input',
      '-'
    ],
    {
      input: JSON.stringify(body)
    }
  )

  await run(
    'gh',
    [
      'api',
      '--method',
      'POST',
      `repos/${repo}/environments/${encodeURIComponent(environment)}/deployment-branch-policies`,
      '--input',
      '-'
    ],
    {
      input: JSON.stringify({ name: 'v*', type: 'tag' })
    }
  )

  await run(
    'npm',
    [
      'trust',
      'github',
      pkg.name,
      '--repo',
      repo,
      '--env',
      environment,
      '--file',
      workflow,
      '--yes'
    ],
    { stdio: 'inherit' }
  )
}

async function getTeamID(org, team) {
  const result = await run('gh', ['api', `orgs/${org}/teams/${team}`, '--jq', '.id'])

  return parseInt(result, 10)
}

async function getUserID(login) {
  const result = await run('gh', ['api', `users/${login}`, '--jq', '.id'])

  return parseInt(result, 10)
}

function parseRepository(pkg) {
  const repo = pkg.repository

  if (!repo) {
    throw new Error('Missing repository field in package.json')
  }

  const url = typeof repo === 'string' ? repo : repo.url

  if (!url) {
    throw new Error('Missing repository URL in package.json')
  }

  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)

  if (!match) {
    throw new Error(`Could not parse GitHub repository from URL: ${url}`)
  }

  return `${match[1]}/${match[2]}`
}
