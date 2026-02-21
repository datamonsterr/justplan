# GitHub Copilot Instructions - JustPlan

**Always follow these instructions for consistent development patterns.**

---

## Project Overview

**JustPlan** is an intelligent time management app built with Next.js 14 (App Router), Supabase, and Google APIs. It combines automatic task scheduling with customizable Jira-like workflow states.

**Key Features:**
- AI-powered task breakdown (Gemini Flash)
- AI auto-categorization into workflow states
- Automatic scheduling engine
- Two-way Google Calendar/Tasks sync
- Customizable workflow states with transitions

---

## File Structure & Placement Rules

### Source Code (`src/`)

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Auth-related routes (login, callback)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API route handlers
│   │   ├── tasks/         # Task CRUD endpoints
│   │   ├── workflows/     # Workflow management endpoints
│   │   ├── scheduling/    # Scheduling engine endpoints
│   │   ├── google/        # Google API integration endpoints
│   │   └── ai/            # AI endpoints (breakdown, categorization)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── ui/               # Reusable UI components (Button, Dialog, etc.)
│   ├── tasks/            # Task-specific components (TaskCard, TaskList)
│   ├── calendar/         # Calendar view components
│   ├── workflows/        # Workflow state components
│   └── [feature]/        # Feature-specific components
│
├── lib/                   # Utility libraries and helpers
│   ├── supabase/         # Supabase client configurations
│   │   ├── client.ts     # Client-side Supabase client
│   │   ├── server.ts     # Server-side Supabase client
│   │   └── middleware.ts # Auth middleware
│   ├── google/           # Google API integrations
│   │   ├── calendar.ts   # Calendar API client
│   │   ├── tasks.ts      # Tasks API client
│   │   └── oauth.ts      # OAuth helpers
│   ├── scheduling/       # Scheduling algorithm
│   │   ├── engine.ts     # Core scheduling logic
│   │   ├── availability.ts # Availability calculator
│   │   └── priority.ts   # Task prioritization
│   ├── workflows/        # Workflow state logic
│   │   ├── transitions.ts # State transition rules
│   │   └── categorization.ts # AI categorization
│   ├── ai/               # AI integrations
│   │   ├── gemini.ts     # Gemini API client
│   │   ├── breakdown.ts  # Task breakdown logic
│   │   └── categorize.ts # Auto-categorization logic
│   ├── utils.ts          # General utilities
│   └── helpers.ts        # Helper functions
│
├── services/              # Business logic services
│   ├── task-service.ts   # Task CRUD operations
│   ├── workflow-service.ts # Workflow management
│   ├── scheduling-service.ts # Scheduling operations
│   ├── google-sync-service.ts # Google sync logic
│   └── ai-service.ts     # AI service wrapper
│
├── hooks/                 # Custom React hooks
│   ├── use-tasks.ts      # Task management hooks
│   ├── use-workflows.ts  # Workflow hooks
│   ├── use-calendar.ts   # Calendar hooks
│   └── use-auth.ts       # Auth hooks
│
├── types/                 # TypeScript type definitions
│   ├── database.types.ts # Supabase generated types
│   ├── tasks.ts          # Task types
│   ├── workflows.ts      # Workflow types
│   └── index.ts          # Exported types
│
├── workers/               # Background job processors
│   ├── scheduling-worker.ts # Scheduling job processor
│   └── sync-worker.ts    # Google sync worker
│
└── middleware.ts          # Next.js middleware (auth)
```

### Documentation (`docs/`)

**Keep all detailed planning and architecture docs in `docs/`:**

- `01-requirements.md` - Feature requirements and specifications
- `02-development-plan.md` - Phased implementation plan
- `03-architecture.md` - System architecture and tech stack
- `04-database-schema.md` - Database design and migrations
- `05-test-plan.md` - Testing strategy and specifications

### Root-Level Files

**Operational documentation and configs in root:**

- `README.md` - Project overview and quick start
- `DEPLOYMENT.md` - **Single comprehensive deployment guide** (not split into multiple files)
- `SETUP.md` - Local development setup
- Configuration files: `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, etc.

**Rule**: Never create multiple deployment docs (like `DEPLOYMENT_CHECKLIST.md`). Keep it in **one comprehensive guide** in `DEPLOYMENT.md`.

### Tests (`tests/`)

```
tests/
├── unit/                  # Unit tests
│   ├── lib/              # Tests for lib/ utilities
│   ├── services/         # Tests for services/
│   └── components/       # Component unit tests
├── integration/           # Integration tests
│   ├── api/              # API route tests
│   └── services/         # Service integration tests
├── e2e/                   # End-to-end tests (Playwright)
│   ├── auth.spec.ts
│   ├── tasks.spec.ts
│   └── workflows.spec.ts
├── fixtures/              # Test data and fixtures
└── setup.ts               # Test configuration
```

---

## Package Manager: pnpm

**Always use `pnpm` for all operations:**

```bash
# Install dependencies
pnpm add <package>

# Run scripts
pnpm dev
pnpm build
pnpm test

# Never use npm or yarn
❌ npm install
❌ yarn add
```

---

## Development Workflows

### 1. Planning Phase (Before Implementation)

**When to plan:**
- New features with multiple steps
- Architecture changes
- Complex integrations

**Where to write plans:**
- **Comprehensive features**: Add to `docs/02-development-plan.md` under appropriate phase
- **Quick tasks**: Use todo list tool to track steps (no separate file needed)
- **Architecture decisions**: Add to `docs/03-architecture.md`
- **Database changes**: Update `docs/04-database-schema.md`

**How to plan:**
1. Use the `brainstorming` skill for new features
2. Use the `writing-plans` skill for multi-step tasks
3. Document in appropriate `docs/` file
4. Create todo list for execution tracking

### 2. Execution Phase

**Execute in this order:**
1. Database changes (migrations in `supabase/migrations/`)
2. Type definitions (`src/types/`)
3. Services (`src/services/`)
4. API routes (`src/app/api/`)
5. Components (`src/components/`)
6. Tests (alongside implementation)
7. Update docs if behavior changes

---

## Skill Usage Guidelines

### Backend Development

**Use these skills:**
- `backend-patterns` - API design, service patterns
- `nextjs-best-practices` - App Router patterns, server actions
- `database-schema-designer` - Schema changes, migrations
- `typescript-expert` - Type-safe implementations

**Patterns:**
- Server Actions in route handlers or `actions.ts` files
- Services for business logic (not in components)
- Supabase client from `src/lib/supabase/server.ts` for server-side
- Zod for validation

### Frontend Development

**Use these skills:**
- `react` - Component development
- `vercel-react-best-practices` - Performance optimization
- `nextjs-best-practices` - App Router, data fetching
- `typescript-expert` - Type-safe components

**Patterns:**
- Server Components by default (use `'use client'` only when needed)
- Client-side Supabase from `src/lib/supabase/client.ts`
- React Query for data fetching in client components
- Zustand for global client state (UI state only)

### API Development

**Use these skills:**
- `api-patterns` - API design decisions
- `backend-patterns` - Response patterns, error handling
- `nextjs-best-practices` - Route handler patterns

**Patterns:**
- Route handlers in `src/app/api/[feature]/route.ts`
- Zod for input validation
- Consistent error responses
- Rate limiting for external API calls

### Database Work

**Use these skills:**
- `database-schema-designer` - Schema design
- `supabase` skills - Supabase-specific patterns

**Patterns:**
- Migrations in `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
- RLS policies for all tables
- Indexes for common queries
- Generated types: `pnpm supabase:types`

### Testing

**Use these skills:**
- `testing` - Vitest patterns, mocking
- `playwright-e2e-builder` - E2E test planning
- `webapp-testing` - Testing local deployments

**Patterns:**
- Co-locate tests: `component.tsx` → `component.test.tsx`
- Test services separately from components
- Mock external APIs (Google, Gemini)
- Use fixtures from `tests/fixtures/`

### AI Integration

**Use these skills:**
- `context7-auto-research` - Get latest Gemini API docs
- `typescript-expert` - Type-safe AI responses

**Patterns:**
- AI calls in `src/lib/ai/` or `src/services/ai-service.ts`
- Server-side only (API routes or Server Actions)
- Error handling with fallbacks
- Rate limiting and caching
- Zod validation for AI responses

### Deployment

**Use these skills:**
- `best-practices` - Security, performance

**Patterns:**
- Single source of truth: `DEPLOYMENT.md` (root)
- Environment variables in `.env.example` and `.env.production.example`
- Vercel-specific configs in `vercel.json`
- Never split deployment docs into multiple files
- Use Upstash Redis for production (seamless Vercel integration)

---

## Code Conventions

### TypeScript

**Use these skills:**
- `typescript-expert` - Advanced patterns
- `coding-standards` - General conventions

**Patterns:**
```typescript
// Explicit return types for functions
export async function getTasks(userId: string): Promise<Task[]> { }

// Zod for runtime validation
const taskSchema = z.object({
  title: z.string().min(1),
  estimatedDuration: z.number().positive(),
});

// Type-safe API responses
type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };
```

### React Components

```typescript
// Server Components (default)
export default async function TaskList() {
  const tasks = await getTasks();
  return <div>...</div>;
}

// Client Components (only when needed)
'use client';
export function TaskCard({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = useState(false);
  return <div>...</div>;
}
```

### File Naming

- Components: PascalCase (`TaskCard.tsx`)
- Utilities: kebab-case (`task-utils.ts`)
- Tests: same name + `.test.ts` (`task-utils.test.ts`)
- Types: kebab-case (`task-types.ts`)
- API routes: lowercase (`route.ts`, `tasks/route.ts`)

### Import Order

```typescript
// 1. External packages
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// 2. Internal lib/services
import { supabase } from '@/lib/supabase/client';
import { TaskService } from '@/services/task-service';

// 3. Components
import { Button } from '@/components/ui/Button';

// 4. Types
import type { Task } from '@/types/tasks';

// 5. Relative imports
import { formatDate } from './utils';
```

---

## Tech Stack Specifics

### Next.js 14 App Router

- **Server Components**: Default for all components
- **Client Components**: Only for interactivity (forms, modals, hooks)
- **Server Actions**: For mutations from client components
- **Route Handlers**: For API endpoints
- **Middleware**: For auth checks (`src/middleware.ts`)

### Supabase

- **Client-side**: `src/lib/supabase/client.ts` (for client components)
- **Server-side**: `src/lib/supabase/server.ts` (for server components, route handlers)
- **Middleware**: `src/lib/supabase/middleware.ts` (for auth middleware)
- **RLS**: Always enabled, policies for all tables
- **Migrations**: `supabase/migrations/` (timestamped SQL files)

### Google APIs

- **OAuth**: Handled by Supabase Auth
- **Calendar API**: `src/lib/google/calendar.ts`
- **Tasks API**: `src/lib/google/tasks.ts`
- **Tokens**: Stored securely in Supabase
- **Rate limiting**: Implement exponential backoff

### Gemini AI (Google AI Studio)

- **API Key**: `GEMINI_API_KEY` environment variable
- **Model**: `gemini-1.5-flash` (fast, cost-effective)
- **Client**: `src/lib/ai/gemini.ts`
- **Server-side only**: Never expose API key to client
- **Rate limits**: 50 breakdowns/100 categorizations per user per day
- **Caching**: Cache identical requests (24 hours)

### Redis (Upstash)

- **REST Client**: `@upstash/redis` for all app code (serverless-friendly)
- **Environment**: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- **Usage**: `import { redis } from '@/lib/redis'`
- **BullMQ**: Uses TCP connection (`REDIS_URL`) for background job queues
- **Workers**: `src/workers/` (optional, for Phase 2 scheduling)

**Patterns:**
```typescript
// Direct Redis operations (REST API)
import { redis } from '@/lib/redis';
await redis.set('key', 'value');
const result = await redis.get('key');

// Background jobs (TCP via BullMQ)
import { schedulingQueue } from '@/lib/redis';
await schedulingQueue.add('job-name', { data: 'value' });
```

---

## Common Patterns

### Creating a New Feature

1. **Plan** (use `brainstorming` skill):
   ```
   - Define requirements
   - Identify affected components
   - Plan database changes
   - Outline API endpoints
   ```

2. **Database** (use `database-schema-designer`):
   ```bash
   # Create migration
   supabase migration new feature_name
   
   # Edit SQL in supabase/migrations/
   # Run locally
   supabase db reset
   ```

3. **Types** (`src/types/`):
   ```typescript
   export interface NewFeature {
     id: string;
     userId: string;
     // ... fields
   }
   ```

4. **Service** (`src/services/`):
   ```typescript
   export class NewFeatureService {
     async create(data: CreateData): Promise<NewFeature> { }
     async getById(id: string): Promise<NewFeature | null> { }
   }
   ```

5. **API Route** (`src/app/api/feature/route.ts`):
   ```typescript
   export async function POST(request: Request) {
     // Validate input with Zod
     // Call service
     // Return response
   }
   ```

6. **Component** (`src/components/feature/`):
   ```typescript
   // Server Component for initial render
   // Client Component for interactivity
   ```

7. **Tests** (alongside each file):
   ```typescript
   // service.test.ts
   // component.test.tsx
   ```

### Adding AI Features

1. **Define prompt** in service file
2. **Call Gemini API** server-side only
3. **Validate response** with Zod
4. **Cache results** (avoid duplicate calls)
5. **Track usage** in `ai_usage_quota` table
6. **Handle errors** gracefully (fallback to manual)

### Debugging

**Use the `debug` skill for:**
- Adding debug logging
- Understanding log namespaces
- Implementing debugging features

**Pattern:**
```typescript
import debug from 'debug';
const log = debug('justplan:service:tasks');

log('Creating task %o', taskData);
```

---

## Environment Variables

### Required Variables

**Local Development** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-publishable-key
SUPABASE_SECRET_KEY=local-secret-key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GEMINI_API_KEY=xxx

# Upstash Redis REST API (serverless-friendly)
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token

# Redis TCP URL (optional, only for BullMQ workers)
REDIS_URL=rediss://default:password@your-region.upstash.io:6380

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Note:** For local Supabase, you can still use the JWT-based anon/service_role keys if running `supabase start`. For hosted Supabase projects, use the new Publishable Key and Secret Key from the [API Keys settings](https://supabase.com/dashboard/project/_/settings/api-keys).

**Upstash Redis:** REST API is preferred for all serverless Redis operations. TCP URL (`REDIS_URL`) is only needed if you're running BullMQ workers for background jobs.
```

**Production** (Vercel Environment Variables):
- See `.env.production.example`
- Set in Vercel Dashboard → Settings → Environment Variables

### Naming Convention

- `NEXT_PUBLIC_*` - Exposed to browser (use sparingly)
- Others - Server-side only (secrets)

---

## Documentation Updates

**When to update docs:**

- **Requirements change**: Update `docs/01-requirements.md`
- **Architecture changes**: Update `docs/03-architecture.md`
- **Database changes**: Update `docs/04-database-schema.md`
- **Deployment changes**: Update `DEPLOYMENT.md` (root)
- **Setup changes**: Update `SETUP.md` (root)

**Never create:**
- Separate checklist files (keep in main doc)
- Individual change logs (use git commits)
- Duplicate documentation

---

## Quick Reference

### Starting Development

```bash
pnpm install                # Install dependencies
pnpm supabase:start        # Start local Supabase
pnpm dev                   # Start Next.js dev server
```

### Running Tests

```bash
pnpm test                  # Unit tests (watch)
pnpm test:unit             # Unit tests (once)
pnpm test:integration      # Integration tests
pnpm test:e2e              # E2E tests
pnpm test:all              # All tests
```

### Database Operations

```bash
pnpm supabase:reset        # Reset local DB to migrations
pnpm supabase:push         # Push migrations to remote
pnpm supabase:diff         # Generate migration from changes
```

### Code Quality

```bash
pnpm type-check            # TypeScript checks
pnpm lint                  # ESLint
pnpm format                # Prettier
```

### Building

```bash
pnpm build                 # Production build
pnpm start                 # Start production server
```

---

## Decision-Making Framework

**When choosing between approaches, use:**

- `architecture` skill - For architecture decisions
- `api-patterns` skill - For API design choices
- `best-practices` skill - For code quality decisions

**Document decisions in:**
- `docs/03-architecture.md` - Architecture Decision Records (ADRs)

---

## Summary: Key Rules

1. ✅ **Use pnpm** (never npm/yarn)
2. ✅ **Single comprehensive docs** (no split files like deployment checklists)
3. ✅ **Plan in `docs/`**, execute in `src/`
4. ✅ **Operational docs in root** (`DEPLOYMENT.md`, `SETUP.md`)
5. ✅ **Server Components by default**, client only when needed
6. ✅ **Type everything** with TypeScript
7. ✅ **Test alongside implementation**
8. ✅ **Use appropriate skills** for each task type
9. ✅ **Keep file structure consistent** with conventions above
10. ✅ **AI on server-side only** with rate limiting and caching

---

**These instructions are always active. Follow them consistently for predictable, high-quality results.**
