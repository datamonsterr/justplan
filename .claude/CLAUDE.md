# Claude Instructions - JustPlan

## Package Manager
- Must use `pnpm` only in this repository.
- Never use `npm`, `yarn`, or `npx`.
- Use `pnpm dlx <cli>` for one-off CLI commands.

## UI Components
- Prefer existing UI components in `src/components/ui` before creating new ones.
- When new shadcn components are needed, use:

```bash
pnpm dlx shadcn@latest add <component>
```
