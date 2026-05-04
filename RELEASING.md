# Releasing

```sh
npm version patch     # or minor / major: bumps version, commits, tags v*
git push --follow-tags
```

CI takes over on tag push. The `release.yml` workflow:

1. Verifies the tag matches `package.json` version
2. `npm ci` → lint → typecheck → tests → build
3. `npm publish --access public --provenance` (OIDC)

`--provenance` records a supply-chain attestation linking the published tarball to this commit + workflow run.

## One-time setup (Trusted Publishing via OIDC)

1. https://www.npmjs.com/package/@jean.gnc/ynab-mcp-server/access → "Trusted publishers" → "Add"
2. Provider: **GitHub Actions**
3. Organization: `jeangnc`
4. Repository: `ynab-mcp-server`
5. Workflow filename: `release.yml`
6. Environment name: *(leave blank)*

The workflow already has `permissions: id-token: write`. No NPM_TOKEN secret required.
