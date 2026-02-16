# JustPlan - Architecture & Tech Stack

**Project:** JustPlan  
**Version:** 1.0  
**Date:** February 17, 2026

---

## Executive Summary

JustPlan is built as a modern, full-stack web application using Next.js 14+ (App Router), Supabase (PostgreSQL + Auth), and Google APIs. The architecture prioritizes rapid development, scalability, and maintainability while keeping infrastructure costs low.

**Key Architectural Principles:**
- **Server-first:** Leverage Next.js Server Components and Server Actions
- **API abstraction:** Google APIs hidden behind service layer for testability
- **Database-driven:** PostgreSQL as single source of truth
- **Real-time capable:** Supabase real-time for future team features
- **Stateless frontend:** React with optimistic UI updates

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         Next.js Frontend (React)             │   │
│  │   - Server Components (SSR)                  │   │
│  │   - Client Components (Interactive)          │   │
│  │   - Server Actions (Mutations)               │   │
│  └─────────────────┬───────────────────────────┘   │
└────────────────────┼─────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼─────────────────────────────────┐
│              Next.js API Layer                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Server Actions / Route Handlers             │  │
│  │  - Authentication middleware                 │  │
│  │  - Request validation                        │  │
│  │  - Error handling                            │  │
│  └────┬─────────────────────────┬────────────┬──┘  │
└────────┼─────────────────────────┼────────────┼─────┘
         │                         │            │
         ▼                         ▼            ▼
┌────────────────┐    ┌─────────────────┐  ┌──────────────┐
│   Supabase     │    │  Scheduling     │  │   Google     │
│   Services     │    │    Engine       │  │    APIs      │
│                │    │                 │  │              │
│ - Auth         │    │ - Algorithm     │  │ - Calendar   │
│ - PostgreSQL   │    │ - Job Queue     │  │ - Tasks      │
│ - Storage      │    │ - Worker        │  │ - OAuth      │
│ - Real-time    │    │                 │  │              │
└────────────────┘    └─────────────────┘  └──────────────┘
         │                     │                    │
         └─────────────────────┴────────────────────┘
                          Data Flow
```

### Component Layers

#### 1. Presentation Layer (Next.js Frontend)
- **Server Components:** Initial page renders, data fetching
- **Client Components:** Interactive UI (calendar, drag-drop)
- **Server Actions:** Form submissions, mutations
- **React Query (TanStack Query):** Client-side caching and optimistic updates

#### 2. API Layer (Next.js Backend)
- **Route Handlers:** RESTful endpoints for external integrations
- **Server Actions:** Type-safe mutations from client components
- **Middleware:** Auth checks, rate limiting, logging

#### 3. Business Logic Layer
- **Services:** Task service, calendar service, workflow service
- **Scheduling Engine:** Standalone module with algorithm
- **Integration Layer:** Google API clients with retry logic

#### 4. Data Layer
- **Supabase PostgreSQL:** Primary database
- **Row Level Security (RLS):** Multi-tenant data isolation
- **Migrations:** Version-controlled schema changes

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2+ | React framework with App Router |
| **React** | 18+ | UI library |
| **TypeScript** | 5.0+ | Type safety |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **Shadcn UI** | Latest | Component library (based on Radix UI) |
| **TanStack Query** | 5.0+ | Server state management, caching |
| **Zustand** | 4.5+ | Client state management (UI state) |
| **React Hook Form** | 7.5+ | Form management and validation |
| **Zod** | 3.22+ | Schema validation (client + server) |
| **date-fns** | 3.0+ | Date manipulation (lightweight) |
| **DnD Kit** | 6.1+ | Drag-and-drop for calendar |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API** | 14.2+ | Server-side logic, API routes |
| **Supabase JS** | 2.39+ | Supabase client |
| **PostgreSQL** | 15+ | Database (via Supabase) |
| **Supabase Auth** | - | Authentication (Google OAuth) |
| **Google APIs** | - | Calendar API v3, Tasks API v1 |
| **BullMQ** | 5.0+ | Job queue for scheduling tasks |
| **Redis** | 7.2+ | Queue backend + caching |

### Development & Testing

| Technology | Purpose |
|------------|---------|
| **Vitest** | Unit and integration testing |
| **Testing Library** | React component testing |
| **Playwright** | E2E testing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **TypeScript** | Type checking |

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Next.js hosting and deployment |
| **Supabase Cloud** | Database and auth hosting |
| **Upstash Redis** | Serverless Redis for job queue |
| **GitHub Actions** | CI/CD pipeline |
| **Sentry** | Error tracking and monitoring |

---

## Detailed Architecture

### 1. Authentication Flow

```
┌──────────┐                                    ┌──────────────┐
│  User    │                                    │   Google     │
│  Browser │                                    │   OAuth      │
└────┬─────┘                                    └──────┬───────┘
     │                                                  │
     │ 1. Click "Login with Google"                   │
     ├──────────────────────────────────────────────► │
     │                                                  │
     │ 2. OAuth consent flow                           │
     │ ◄────────────────────────────────────────────┤ │
     │                                                  │
     │ 3. Authorization code                           │
     ├──────────────────────────────────────────────► │
     │                                                  │
     ◄────────────────────────────────────────────┤ │
     │ 4. Access token + Refresh token                │
     │                                                  │
     ▼                                                  │
┌─────────────────┐                                    │
│   Supabase      │                                    │
│   Auth          │                                    │
│                 │                                    │
│ - Store tokens  │                                    │
│ - Create user   │                                    │
│ - Session mgmt  │                                    │
└─────────────────┘                                    │
```

**Key Points:**
- Supabase handles OAuth flow with Google
- Google tokens stored securely in Supabase
- Access token used for Calendar/Tasks API calls
- Refresh token for long-lived sessions

### 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                  User Action                         │
│           (Create task, change priority)             │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            Client-Side (React)                       │
│  1. Optimistic update (instant UI feedback)         │
│  2. Trigger Server Action                           │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         Server Action (Next.js)                      │
│  1. Validate input (Zod schema)                     │
│  2. Check authentication                            │
│  3. Call service layer                              │
└────────────────────┬─────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌──────────────┐
│  Database   │ │ Schedule│ │   Google     │
│  (Supabase) │ │ Engine  │ │   API Sync   │
│             │ │         │ │              │
│ - Save task │ │ - Queue │ │ - Update     │
│ - Update    │ │   job   │ │   Tasks      │
│   state     │ │         │ │              │
└─────────────┘ └─────────┘ └──────────────┘
         │           │           │
         └───────────┼───────────┘
                     ▼
┌─────────────────────────────────────────────────────┐
│         Response to Client                           │
│  1. Return updated data                             │
│  2. Client reconciles optimistic update             │
└─────────────────────────────────────────────────────┘
```

### 3. Scheduling Engine Architecture

```
┌─────────────────────────────────────────────────────┐
│              Scheduling Trigger                      │
│  - New task created                                 │
│  - Task priority changed                            │
│  - Working hours updated                            │
│  - Manual "Reschedule" button                       │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          Enqueue Scheduling Job                      │
│  - Job ID: user_id + timestamp                      │
│  - Priority: high / normal                          │
│  - Deduplicate: prevent multiple concurrent jobs    │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            BullMQ Job Queue                          │
│  - Redis-backed queue                               │
│  - Rate limiting: max 1 job per user                │
│  - Retry on failure (3 attempts)                    │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         Scheduling Algorithm Worker                  │
│                                                      │
│  1. Fetch user data:                                │
│     - All tasks (unscheduled + scheduled)           │
│     - Working hours                                 │
│     - Google Calendar events (busy times)           │
│                                                      │
│  2. Build availability map:                         │
│     - Next 14 days                                  │
│     - Mark busy: existing events                    │
│     - Mark available: working hours - busy          │
│                                                      │
│  3. Prioritize tasks:                               │
│     - Sort by: deadline, priority, state            │
│                                                      │
│  4. Assign tasks to slots:                          │
│     - Greedy algorithm: best fit                    │
│     - Respect constraints (min/max duration)        │
│     - Add buffer time                               │
│                                                      │
│  5. Generate schedule:                              │
│     - List of (task_id, start_time, end_time)       │
│                                                      │
│  6. Persist to database:                            │
│     - Update tasks with schedule                    │
│     - Mark as scheduled                             │
│                                                      │
│  7. Sync to Google Calendar:                        │
│     - Create/update events                          │
│     - Batch API calls                               │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           Notify User (Real-time)                    │
│  - "Schedule updated" message                       │
│  - Refresh calendar view                            │
└─────────────────────────────────────────────────────┘
```

**Scheduling Algorithm (High-Level):**

```typescript
function scheduleTasksGreedy(
  tasks: Task[],
  availability: TimeSlot[],
  constraints: Constraints
): Schedule {
  const schedule = []
  const sortedTasks = prioritizeTasks(tasks) // Sort by priority
  
  for (const task of sortedTasks) {
    const suitableSlot = findBestSlot(
      availability,
      task.estimatedDuration,
      task.deadline,
      constraints
    )
    
    if (suitableSlot) {
      schedule.push({
        taskId: task.id,
        start: suitableSlot.start,
        end: suitableSlot.end
      })
      
      // Remove allocated time from availability
      availability = removeSlot(availability, suitableSlot)
    }
  }
  
  return schedule
}
```

### 4. Google Integration Architecture

```
┌─────────────────────────────────────────────────────┐
│           Google Calendar/Tasks Sync                 │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Calendar Sync    │    │  Tasks Sync      │
│                  │    │                  │
│ 1. Read Events   │    │ 1. Read Tasks    │
│ 2. Write Blocks  │    │ 2. Write Tasks   │
│ 3. Update Blocks │    │ 3. Update Status │
│ 4. Delete Blocks │    │ 4. Handle Edits  │
└─────────┬────────┘    └────────┬─────────┘
          │                      │
          └──────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          Google API Client Layer                     │
│                                                      │
│ - Authentication: OAuth 2.0                         │
│ - Rate limiting: Exponential backoff                │
│ - Retry logic: 3 attempts with delay                │
│ - Batch operations: Group API calls                 │
│ - Error handling: Graceful degradation              │
│ - Caching: Store responses in DB                    │
└─────────────────────────────────────────────────────┘
```

**Sync Strategy:**

| Direction | Strategy | Conflict Resolution |
|-----------|----------|---------------------|
| **Calendar → App** | Poll every 5 min OR webhook | Read-only (app doesn't modify external events) |
| **App → Calendar** | Immediate on schedule change | App is source of truth for task blocks |
| **Tasks → App** | Poll every 5 min | Timestamp-based (most recent wins) |
| **App → Tasks** | Immediate on task change | App is source of truth for workflow states |

### 5. Database Schema Architecture

```
┌──────────────────────────────────────────────────┐
│                    users                          │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ email                                            │
│ google_user_id                                   │
│ created_at                                       │
│ updated_at                                       │
└────────┬─────────────────────────────────────────┘
         │
         │ 1:N
         │
┌────────▼─────────────────────────────────────────┐
│              user_settings                        │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ timezone                                         │
│ week_start_day                                   │
│ default_task_duration                            │
│ buffer_time_minutes                              │
└────────┬─────────────────────────────────────────┘
         │
         │ 1:N
         │
┌────────▼─────────────────────────────────────────┐
│            working_hours                          │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ day_of_week (0-6)                                │
│ start_time                                       │
│ end_time                                         │
│ is_working_day                                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│                    tasks                          │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ title                                            │
│ description                                      │
│ estimated_duration_minutes                       │
│ deadline                                         │
│ priority (enum: low, medium, high)               │
│ workflow_state_id (FK → workflow_states)         │
│ is_scheduled                                     │
│ scheduled_start                                  │
│ scheduled_end                                    │
│ google_task_id                                   │
│ google_calendar_event_id                         │
│ created_at                                       │
│ updated_at                                       │
└────────┬─────────────────────────────────────────┘
         │
         │ N:1
         │
┌────────▼─────────────────────────────────────────┐
│            workflow_states                        │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ name                                             │
│ color                                            │
│ order                                            │
│ is_terminal                                      │
│ scheduling_priority_boost                        │
│ should_auto_schedule                             │
└────────┬─────────────────────────────────────────┘
         │
         │ 1:N
         │
┌────────▼─────────────────────────────────────────┐
│         workflow_transitions                      │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ from_state_id (FK → workflow_states)             │
│ to_state_id (FK → workflow_states)               │
│ condition_type (enum)                            │
│ condition_value (jsonb)                          │
│ is_enabled                                       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│         google_calendar_events                    │
├──────────────────────────────────────────────────┤
│ id (uuid, PK)                                    │
│ user_id (FK → users)                             │
│ google_event_id                                  │
│ calendar_id                                      │
│ summary                                          │
│ start_time                                       │
│ end_time                                         │
│ is_all_day                                       │
│ synced_at                                        │
└──────────────────────────────────────────────────┘
```

*Full schema details in separate document*

---

## Folder Structure

```
justplan/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/              # Protected route group
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── workflows/
│   │   └── settings/
│   ├── api/                      # API route handlers
│   │   ├── auth/
│   │   ├── schedule/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components
│   ├── calendar/                 # Calendar-specific
│   ├── tasks/                    # Task-specific
│   └── workflows/                # Workflow-specific
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client & helpers
│   ├── google/                   # Google API clients
│   ├── scheduling/               # Scheduling engine
│   │   ├── algorithm.ts
│   │   ├── availability.ts
│   │   └── priority.ts
│   ├── workflows/                # Workflow engine
│   │   ├── transitions.ts
│   │   └── conditions.ts
│   ├── db/                       # Database utilities
│   └── utils.ts
├── services/                     # Business logic services
│   ├── task.service.ts
│   ├── calendar.service.ts
│   ├── workflow.service.ts
│   └── sync.service.ts
├── types/                        # TypeScript types
│   ├── task.ts
│   ├── calendar.ts
│   └── workflow.ts
├── hooks/                        # Custom React hooks
│   ├── use-tasks.ts
│   ├── use-calendar.ts
│   └── use-workflows.ts
├── workers/                      # Background job workers
│   ├── schedule.worker.ts
│   └── sync.worker.ts
├── supabase/                     # Supabase schema
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                         # Documentation
├── .env.example
├── .env.local
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Key Architectural Decisions

### ADR-001: Use Next.js App Router over Pages Router

**Decision:** Use Next.js 14+ App Router (not Pages Router)

**Rationale:**
- Server Components reduce client-side JavaScript
- Server Actions provide type-safe mutations without API endpoints
- Better performance with streaming and partial rendering
- Future-proof (Vercel's recommended approach)

**Trade-offs:**
- Steeper learning curve
- Some third-party libraries not yet compatible

---

### ADR-002: Supabase over Self-Hosted PostgreSQL

**Decision:** Use Supabase for database and auth

**Rationale:**
- Built-in authentication with Google OAuth
- Row-Level Security for multi-tenant data
- Real-time subscriptions (useful for team features)
- Automatic backups and scaling
- Lower operational overhead

**Trade-offs:**
- Vendor lock-in (mitigated by open-source Postgres)
- Cost increases with scale (acceptable for target user count)

---

### ADR-003: Greedy Scheduling Algorithm for MVP

**Decision:** Start with greedy algorithm (not constraint satisfaction or AI)

**Rationale:**
- Simpler to implement and debug
- Fast enough for 100+ tasks
- Deterministic behavior (easier to explain to users)
- Can iterate based on user feedback

**Trade-offs:**
- Not optimal solution (may not find best schedule)
- May struggle with complex constraints
- Future: can upgrade to CSP or heuristic search

---

### ADR-004: BullMQ for Job Queue

**Decision:** Use BullMQ (not in-process scheduling)

**Rationale:**
- Decouple scheduling from web requests (better UX)
- Retry logic and failure handling
- Rate limiting to prevent abuse
- Scales horizontally (multiple workers)

**Trade-offs:**
- Requires Redis (added infrastructure)
- More complex than in-process
- Use Upstash Redis (serverless) to minimize cost

---

### ADR-005: App as Source of Truth for Workflow States

**Decision:** Workflow states live only in app (not synced to Google)

**Rationale:**
- Google Tasks doesn't support custom states
- Syncing would require hacks (labels, specific task lists)
- Simpler to keep workflow logic in one place
- Easier to build features (automatic transitions)

**Trade-offs:**
- Users can't see workflow states in Google Tasks
- Reduces utility of Google Tasks integration
- Accepted: Google Tasks is "backup" view only

---

## Security Architecture

### Authentication & Authorization

```
┌────────────────────────────────────────────────┐
│           Request from Browser                 │
└──────────────────┬─────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────┐
│         Next.js Middleware                     │
│  - Check for Supabase session cookie          │
│  - Verify JWT token                           │
│  - Extract user_id                            │
└──────────────────┬─────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │ Authenticated?      │
         └─────────┬──────────┘
                   │
         ┌─────────┼──────────┐
         │ Yes               No │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│ Proceed to      │   │ Redirect to      │
│ Protected Route │   │ Login Page       │
└─────────────────┘   └──────────────────┘
```

**Row-Level Security (RLS) Policies:**

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar for all user-scoped tables
```

### Data Protection

- **Encryption at rest:** Supabase encrypts all data in PostgreSQL
- **Encryption in transit:** HTTPS everywhere (TLS 1.3)
- **API keys:** Stored in environment variables, never in code
- **Google tokens:** Stored in Supabase (encrypted), never exposed to client
- **CORS:** Restrict API access to app domain only

---

## Performance Considerations

### Frontend Optimization

- **Code splitting:** Dynamic imports for heavy components (calendar lib)
- **Image optimization:** Next.js Image component
- **Font optimization:** Next.js font loading
- **Bundle analysis:** Monitor bundle size with `@next/bundle-analyzer`

### Backend Optimization

- **Database indexes:** On frequently queried columns (user_id, deadline, state_id)
- **Query optimization:** Use `EXPLAIN ANALYZE` to optimize slow queries
- **Caching:** Redis cache for Google API responses (5-minute TTL)
- **Batch operations:** Group Google API calls (batch insert events)

### Scheduling Algorithm Optimization

- **Incremental scheduling:** Only reschedule affected tasks (not entire schedule)
- **Memoization:** Cache availability calculations
- **Early termination:** Stop if schedule is "good enough"

---

## Monitoring & Observability

### Error Tracking
- **Sentry:** Capture frontend and backend errors
- **Error boundaries:** Graceful degradation in React
- **Logging:** Structured logs with context (user_id, request_id)

### Performance Monitoring
- **Vercel Analytics:** Track Web Vitals (LCP, FID, CLS)
- **Database monitoring:** Supabase dashboard (slow queries, connection pool)
- **API monitoring:** Track Google API latency and errors

### User Analytics
- **Posthog** (or similar): Track feature usage
- **Key metrics:**
  - Tasks created per user
  - Scheduling success rate
  - Google sync errors
  - User retention (DAU, WAU)

---

## Deployment Architecture

```
┌───────────────────────────────────────────────────┐
│              GitHub Repository                     │
│         (main branch = production)                │
└────────────────────┬──────────────────────────────┘
                     │
                     │ git push
                     │
                     ▼
┌───────────────────────────────────────────────────┐
│            GitHub Actions (CI/CD)                  │
│                                                    │
│  1. Run linting (ESLint)                          │
│  2. Run type checking (TypeScript)                │
│  3. Run tests (Vitest + Playwright)               │
│  4. Build Next.js app                             │
│  5. Deploy to Vercel                              │
└────────────────────┬──────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────┐
│               Vercel (Production)                  │
│                                                    │
│  - Edge Network (CDN)                             │
│  - Serverless Functions (API routes)              │
│  - Environment variables                          │
│  - Custom domain + SSL                            │
└────────────────────┬──────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────┐
│         External Services                          │
│                                                    │
│  - Supabase (Database, Auth)                      │
│  - Upstash Redis (Job Queue)                      │
│  - Google APIs (Calendar, Tasks)                  │
│  - Sentry (Error tracking)                        │
└───────────────────────────────────────────────────┘
```

**Environments:**

- **Development:** Local (`localhost:3000`)
  - Supabase local (optional)
  - Test Google project
  
- **Staging:** Vercel preview deployment
  - Staging Supabase project
  - Test Google credentials
  
- **Production:** Vercel production
  - Production Supabase project
  - Production Google credentials

---

## Cost Estimation (Monthly)

| Service | Tier | Users | Cost |
|---------|------|-------|------|
| **Vercel** | Hobby/Pro | - | $0-20 |
| **Supabase** | Free/Pro | 100 | $0-25 |
| **Upstash Redis** | Free | - | $0 |
| **Sentry** | Developer | - | $0 |
| **Domain** | - | - | $10 |
| **Total** | | | **$10-55/month** |

*Scales to ~100 users before hitting paid tiers*

---

## Future Considerations

### Scalability Path

1. **100-1,000 users:** Current architecture scales
2. **1,000-10,000 users:** 
   - Move to dedicated Redis instance
   - Consider database read replicas
   - Implement more aggressive caching
3. **10,000+ users:**
   - Horizontal scaling of workers
   - Database sharding (by user_id)
   - CDN for static assets

### Team Features Architecture

When adding team features (Phase 5):

- **Teams table:** Workspace/team management
- **Team members:** User-to-team M:N relationship
- **Shared tasks:** Team-owned tasks with assignments
- **Permissions:** Role-based access control (owner, admin, member)
- **Real-time:** Supabase real-time for collaborative editing

---

## Next Steps

1. ✅ Architecture document complete
2. ⬜ Database schema detailed design (next)
3. ⬜ Review all documents
4. ⬜ Begin Phase 0: Project setup
