# GitHub Workflows

This directory defines CI quality gates for JustPlan with pnpm-only execution.

## Required Quality Gates (`ci.yml`)

Trigger:
- `push` to `master`, `main`, `develop`
- `pull_request` targeting `master`, `main`, `develop`

Required jobs:
1. `lint` (`pnpm lint` + Prettier check)
2. `typecheck` (`pnpm type-check`)
3. `unit` (`pnpm test:unit`)
4. `integration` (`pnpm test:integration`)
5. `build` (`pnpm build`)

Final enforcement:
- `all-checks` (`Quality Gate Summary`) runs with `if: always()`.
- It publishes a markdown gate report in GitHub Step Summary.
- It fails the workflow when any required gate is not `success`.

## Optional E2E Policy (`e2e-policy.yml`)

This workflow is intentionally separate from required PR gates.

Trigger:
- Manual: `workflow_dispatch`
- Scheduled: every Monday at `06:00 UTC` (`0 6 * * 1`)

Behavior:
1. Installs dependencies with pnpm
2. Installs Playwright browser deps
3. Runs `pnpm test:e2e -- --pass-with-no-tests`
4. Uploads `playwright-report` artifact (always)

Policy intent:
- E2E is available for periodic/manual confidence checks
- E2E is not a mandatory merge gate unless branch protection is explicitly configured to require this workflow

## Auto-format Workflow (`format.yml`)

Trigger:
- `pull_request` to `master`, `main`, `develop`
- `workflow_dispatch`

Behavior:
- Runs `pnpm format`
- Commits formatting changes when needed

## Local Parity Commands

Run the required CI gates locally before opening a PR:

```bash
pnpm lint
pnpm type-check
pnpm test:unit
pnpm test:integration
pnpm build
```

Run optional E2E policy locally:

```bash
pnpm test:e2e -- --pass-with-no-tests
```
