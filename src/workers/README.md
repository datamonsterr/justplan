# Workers Directory

## Purpose

Background job processors using BullMQ for async operations.

## Structure

- `scheduling.worker.ts` - Auto-scheduling job processor
- `google-sync.worker.ts` - Google Calendar/Tasks sync
- `workflow-transitions.worker.ts` - Automatic state transitions

## Run

- `tsx watch src/workers/scheduling.worker.ts`
- `tsx watch src/workers/google-sync.worker.ts`
- `tsx watch src/workers/workflow-transitions.worker.ts`

## Guidelines

- Keep jobs idempotent
- Add proper error handling and retries
- Log job execution for debugging
