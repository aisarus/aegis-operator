# Security boundary

This repository is a curated public source snapshot.

The published boundary excludes runtime state, local project memory, account-specific fixtures, credentials, machine-local configuration and private development history. The working project uses a deterministic export/audit step before publication rather than relying on manual deletion alone.

## Runtime principles represented in the snapshot

- Generated checks do not receive the ambient process environment; see [`src/safe-env.js`](src/safe-env.js).
- Evidence paths are constrained to the workspace; see [`src/contract.js`](src/contract.js).
- Provider fallback is conservative around operations that may mutate files or send external actions; see [`src/worker-router.js`](src/worker-router.js).
- A failing mechanical check is treated as evidence, not as an opinion a model can override; see [`src/evidence.js`](src/evidence.js).

## Reporting

If you find a security issue in the published code, please avoid posting working credentials or private data in a public issue. Contact the repository owner through the email listed on the GitHub profile instead.
