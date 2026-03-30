# oidc-publishing

OIDC publishing tools for GitHub and npm.

```
npm i [-g] oidc-publishing
```

## API

#### `await setup([base][, options])`

Options include:

```js
options = {
  environment: 'npm',
  workflow: 'publish.yml',
  reviewers: []
}
```

## CLI

#### `oidc-publishing setup [flags] [entry]`

Flags include:

```
--environment <name>     The deployment environment name (default: npm)
--workflow <file>        The workflow file name (default: publish.yml)
--reviewer <specifier>   The team: or user: that should act as reviewer
```

## License

Apache-2.0
