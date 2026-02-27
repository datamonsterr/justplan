# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, auth routes, and API handlers under `src/app/api/*`.
- `src/components`: UI and feature components (`ui/`, `layout/`, `scheduling/`, `workflows/`).
- `src/lib`: shared logic and integrations (`supabase`, `google`, `redis`, `ai`, scheduling engine).
- `src/services`, `src/hooks`, `src/providers`, `src/workers`, and `src/types` contain domain logic and shared types.
- `tests`: `unit/`, `integration/`, `e2e/`, fixtures, and `tests/setup.ts`.
- `supabase/migrations`: SQL schema changes; keep timestamped migration names (for example `20260221000001_add_subtasks_support.sql`).

## Build, Test, and Development Commands
Use `pnpm` for local development (`packageManager` is pinned to pnpm 8).
- Must use `pnpm` only. Never use `npm`, `yarn`, or `npx` in this repository.
- `pnpm dev`: start local app at `http://localhost:3000`.
- `pnpm build` / `pnpm start`: build and run production output.
- `pnpm lint`: run ESLint rules.
- `pnpm type-check`: run strict TypeScript checks (`tsc --noEmit`).
- `pnpm format`: format code with Prettier.
- `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm test:coverage`: run Vitest/Playwright checks.
- `pnpm supabase:start|stop|reset|push|diff`: local/remote Supabase workflow.

## UI Component Rules
- Prefer existing components in `src/components/ui` before creating new UI primitives.
- For new shadcn components, use `pnpm dlx shadcn@latest add <component>` and adapt the generated output to existing project patterns.

## Coding Style & Naming Conventions
- TypeScript is `strict`; use alias imports via `@/*` for `src/*`.
- Prettier rules: 2 spaces, semicolons, double quotes, trailing commas (`es5`), Tailwind class sorting plugin.
- ESLint extends `next/core-web-vitals` and `@typescript-eslint`; prefix intentionally unused args with `_`.
- Prefer kebab-case file names; keep existing PascalCase component module pattern where already used (for example `src/components/ui/Button.tsx`).
- Name tests `*.test.ts` or `*.test.tsx`.

## Testing Guidelines
- Unit/component tests use Vitest + Testing Library (`jsdom`); E2E uses Playwright in `tests/e2e`.
- Before opening a PR, run: `pnpm lint && pnpm type-check && pnpm test:unit && pnpm build`.
- Generate coverage with `pnpm test:coverage`; project docs target at least 70% unit coverage.
- `test:integration` expects `vitest.integration.config.ts`; add/update it if you introduce integration suites.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style used in recent history: `feat:`, `fix:`, `docs:`, `ci:`, `style:`.
- Keep commits focused and imperative (example: `fix: handle empty task title`).
- PRs should include a short summary, linked issue, test evidence, and UI screenshots/GIFs when applicable.
- Target branches (`main`, `master`, `develop`) must pass CI checks: lint, type-check, unit tests, and build.

## Security & Configuration Tips
- Start from `.env.example` or `.env.production.example`; never commit secrets.
- Verify Supabase, Google OAuth, and Redis environment variables before testing API routes or workers.
