# Executable Test Strategy (F10)

Source of truth: `docs/05-test-plan.md` + current repository scripts/config/tests.

Updated: 2026-02-28

## 1) How to run tests now

- Unit: `pnpm test:unit`
- Integration: `pnpm test:integration`
- E2E: `pnpm test:e2e`
- All suites: `pnpm test:all`
- Coverage: `pnpm test:coverage`

Current config references:
- `vitest.config.ts` (unit, excludes `tests/integration` and `tests/e2e`)
- `vitest.integration.config.ts` (integration, includes `tests/integration/**/*`)
- `playwright.config.ts` (E2E, `tests/e2e`)

## 2) Executable suite matrix

Owner mapping is proposed (no `CODEOWNERS` file exists yet).

| Suite | Required by `05-test-plan` | Concrete files (current or to add) | Command | Owner | Status / Gap |
| --- | --- | --- | --- | --- | --- |
| U1 Scheduling algorithm | `algorithm.test.ts`, `availability.test.ts`, `priority.test.ts` | Existing: `src/lib/scheduling/engine.test.ts`<br>To add: `src/lib/scheduling/availability.test.ts`, `src/lib/scheduling/priority.test.ts` | `pnpm test:unit -- src/lib/scheduling` | Backend (Scheduling) | Partial: only `engine.test.ts` exists |
| U2 Workflow engine/rules | `transitions.test.ts`, `conditions.test.ts` | To add near real logic: `src/services/workflow.service.test.ts` (or `src/lib/workflows/*.test.ts` if workflow core is extracted) | `pnpm test:unit -- src/services/workflow.service.test.ts` | Backend (Workflows) | Missing |
| U3 Utilities | `utils/date-utils/validation` coverage | Existing: `src/lib/utils.test.ts`, `src/lib/helpers.test.ts`, `src/lib/task-parser.test.ts`<br>To add: tests for any new `validation`/date helpers introduced | `pnpm test:unit -- src/lib` | Backend + Frontend shared | Partial |
| U4 React hooks | `use-tasks`, `use-calendar` | To add: `src/hooks/use-tasks.test.tsx`, `src/hooks/use-scheduling.test.tsx`, `src/hooks/use-workflows.test.tsx` | `pnpm test:unit -- src/hooks` | Frontend | Missing |
| I1 DB/service integration | `task/calendar/workflow service` integration | Existing: `tests/integration/smoke.test.ts`<br>To add: `tests/integration/task-service.test.ts`, `tests/integration/workflow-service.test.ts`, `tests/integration/scheduling-service.test.ts` | `pnpm test:integration` | Backend (Services) | Partial: only smoke bootstrap |
| I2 Google integration | `calendar-client`, `tasks-client` integration | To add: `tests/integration/google-calendar.test.ts`, `tests/integration/google-tasks.test.ts` against `src/lib/google/calendar.ts` and `src/lib/google/tasks.ts` | `pnpm test:integration` | Backend (Google) | Missing |
| I3 API route integration | `app/api/tasks`, `app/api/schedule` | To add: `tests/integration/api/tasks.route.test.ts`, `tests/integration/api/scheduling.route.test.ts`, `tests/integration/api/workflows.route.test.ts` | `pnpm test:integration` | Backend (API) | Missing |
| E1 Auth flow | `tests/e2e/auth.spec.ts` | To add: `tests/e2e/auth.spec.ts`, shared `tests/e2e/setup.ts` | `pnpm test:e2e` | QA + Frontend | Missing |
| E2 Task lifecycle flow | `tests/e2e/tasks.spec.ts` | To add: `tests/e2e/tasks.spec.ts` | `pnpm test:e2e` | QA + Frontend | Missing |
| E3 Scheduling flow | `tests/e2e/scheduling.spec.ts` | To add: `tests/e2e/scheduling.spec.ts` | `pnpm test:e2e` | QA + Backend (Scheduling) | Missing |
| E4 Workflow flow | `tests/e2e/workflows.spec.ts` | To add: `tests/e2e/workflows.spec.ts` | `pnpm test:e2e` | QA + Backend (Workflows) | Missing |
| E5 Google sync flow | `tests/e2e/google-integration.spec.ts` | To add: `tests/e2e/google-integration.spec.ts` | `pnpm test:e2e` | QA + Backend (Google) | Missing |
| M1 Manual Chrome agent | `.github/agents/manual-testing/AGENT.md` | To add: `.github/agents/manual-testing/AGENT.md` + checklist doc | Manual runbook | QA | Missing |

## 3) Current gaps that block full execution

1. `docs/05-test-plan.md` still uses `npm` commands; repo standard is `pnpm` only.
2. No `tests/e2e/` specs exist yet, so planned E2E coverage is not executable.
3. `playwright.config.ts` uses `webServer.command: "npm run dev"`; should be `pnpm dev`.
4. Integration suite currently has only `tests/integration/smoke.test.ts` (bootstrap smoke), not feature coverage.
5. Fixture/seed examples in `05-test-plan` are mostly documented in `tests/fixtures/README.md` but not implemented as executable fixture modules/sql in repo.
6. CI (`.github/workflows/ci.yml`) gates unit tests only; no integration or E2E jobs.

## 4) Implementation order (actionable)

1. Baseline infra (Platform/QA)
- Fix Playwright server command to pnpm.
- Add `tests/e2e/setup.ts` and minimal smoke E2E.
- Add executable fixture modules under `tests/fixtures/*.ts` (start with users/tasks/workflow states).

2. Core coverage (Backend)
- Add service integration tests (task/workflow/scheduling).
- Add API integration tests for `tasks` and `scheduling` routes.
- Fill workflow unit tests (`workflow.service` or extracted workflow rule engine).

3. UI + hooks (Frontend)
- Add `use-tasks`/`use-scheduling`/`use-workflows` tests with mocked fetch/API responses.

4. CI hardening (Platform)
- Keep `pnpm test:unit` in PR-required checks.
- Add `pnpm test:integration` as required after suite stabilizes.
- Add `pnpm test:e2e` initially as nightly, then promote to required once flake rate is acceptable.

## 5) Definition of done for F10 execution

- Each suite in Section 2 has at least one executable file in-repo.
- `pnpm test:all` runs successfully in local dev and CI.
- Ownership is explicit per suite and reflected in planning tickets.
