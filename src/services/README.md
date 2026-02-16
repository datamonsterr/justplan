# Services Directory

## Purpose

Services handle data fetching, mutations, and external API integrations.

## Structure

- `tasks.service.ts` - Task CRUD operations
- `workflows.service.ts` - Workflow state management
- `calendar.service.ts` - Calendar sync operations
- `scheduling.service.ts` - Scheduling operations

## Guidelines

- Services should be framework-agnostic
- Use dependency injection where possible
- Return typed results
