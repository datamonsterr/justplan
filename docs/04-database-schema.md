# JustPlan - Database Schema Design

**Project:** JustPlan  
**Version:** 1.0  
**Database:** PostgreSQL 15+ (Supabase)  
**Date:** February 17, 2026

---

## Schema Overview

The database is designed to support:

- Multi-tenant architecture (user isolation via RLS)
- Personal task management with extensibility to teams
- Custom workflow states and transitions
- Google Calendar/Tasks synchronization
- Automatic scheduling history

**Key Principles:**

- ✅ Normalize data (3NF) to prevent anomalies
- ✅ Use UUIDs for primary keys (better for distributed systems)
- ✅ Timestamp all records (created_at, updated_at)
- ✅ Soft deletes where appropriate (deleted_at)
- ✅ Row-Level Security (RLS) for multi-tenancy

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_settings : has
    users ||--o{ working_hours : configures
    users ||--o{ tasks : owns
    users ||--o{ workflow_states : defines
    users ||--o{ google_calendar_events : syncs
    users ||--o{ scheduling_history : has

    workflow_states ||--o{ tasks : categorizes
    workflow_states ||--o{ workflow_transitions : from
    workflow_states ||--o{ workflow_transitions : to

    tasks ||--o{ task_state_history : tracks
    tasks ||--o{ task_blocks : scheduled_as

    users {
        uuid id PK
        string email UK
        string google_user_id UK
        string full_name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    user_settings {
        uuid id PK
        uuid user_id FK
        string timezone
        int week_start_day
        int default_task_duration_minutes
        int buffer_time_minutes
        json preferences
        timestamp updated_at
    }

    working_hours {
        uuid id PK
        uuid user_id FK
        int day_of_week
        time start_time
        time end_time
        boolean is_working_day
    }

    tasks {
        uuid id PK
        uuid user_id FK
        string title
        text description
        int estimated_duration_minutes
        timestamp deadline
        string priority
        uuid workflow_state_id FK
        boolean is_scheduled
        timestamp scheduled_start
        timestamp scheduled_end
        string google_task_id
        string google_calendar_event_id
        json metadata
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    workflow_states {
        uuid id PK
        uuid user_id FK
        string name
        string color
        int order
        boolean is_terminal
        boolean should_auto_schedule
        int scheduling_priority_boost
        timestamp created_at
    }

    workflow_transitions {
        uuid id PK
        uuid user_id FK
        uuid from_state_id FK
        uuid to_state_id FK
        string condition_type
        json condition_value
        boolean is_enabled
        timestamp created_at
    }

    task_state_history {
        uuid id PK
        uuid task_id FK
        uuid from_state_id FK
        uuid to_state_id FK
        string trigger_type
        timestamp transitioned_at
    }

    google_calendar_events {
        uuid id PK
        uuid user_id FK
        string google_event_id UK
        string calendar_id
        string summary
        text description
        timestamp start_time
        timestamp end_time
        boolean is_all_day
        timestamp synced_at
    }

    scheduling_history {
        uuid id PK
        uuid user_id FK
        timestamp scheduled_at
        int tasks_scheduled
        int duration_ms
        string algorithm_version
        json metadata
    }
```

---

## Table Definitions

### 1. users

Core user accounts (managed by Supabase Auth).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    google_user_id TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_user_id ON users(google_user_id);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);
```

**Notes:**

- Syncs with Supabase `auth.users` table
- `google_user_id` for linking to Google OAuth identity

---

### 2. user_settings

User preferences and configuration.

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    week_start_day INTEGER NOT NULL DEFAULT 0, -- 0 = Sunday
    default_task_duration_minutes INTEGER NOT NULL DEFAULT 60,
    buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
    preferences JSONB DEFAULT '{}', -- Flexible custom preferences
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT week_start_day_valid CHECK (week_start_day BETWEEN 0 AND 6),
    CONSTRAINT default_duration_positive CHECK (default_task_duration_minutes > 0),
    CONSTRAINT buffer_time_positive CHECK (buffer_time_minutes >= 0)
);

-- Indexes
CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON user_settings
    USING (auth.uid() = user_id);
```

**Preferences JSONB Example:**

```json
{
  "theme": "dark",
  "calendar_default_view": "week",
  "notifications_enabled": true,
  "auto_schedule_enabled": true,
  "focus_time_start": "09:00",
  "focus_time_end": "12:00"
}
```

---

### 3. working_hours

User's availability schedule (per day of week).

```sql
CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT day_of_week_valid CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_user_day UNIQUE (user_id, day_of_week)
);

-- Indexes
CREATE INDEX idx_working_hours_user_id ON working_hours(user_id);

-- RLS
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own working hours"
    ON working_hours
    USING (auth.uid() = user_id);
```

**Example Data:**

```sql
-- Monday to Friday: 9 AM - 5 PM
INSERT INTO working_hours (user_id, day_of_week, start_time, end_time, is_working_day)
VALUES
    ('user-uuid', 1, '09:00', '17:00', true), -- Monday
    ('user-uuid', 2, '09:00', '17:00', true), -- Tuesday
    ('user-uuid', 3, '09:00', '17:00', true), -- Wednesday
    ('user-uuid', 4, '09:00', '17:00', true), -- Thursday
    ('user-uuid', 5, '09:00', '17:00', true), -- Friday
    ('user-uuid', 0, '00:00', '00:00', false), -- Sunday (off)
    ('user-uuid', 6, '00:00', '00:00', false); -- Saturday (off)
```

---

### 4. tasks

Core task entity.

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    priority task_priority NOT NULL DEFAULT 'medium',
    workflow_state_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,

    -- Scheduling fields
    is_scheduled BOOLEAN NOT NULL DEFAULT false,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN NOT NULL DEFAULT false, -- Manually pinned to specific time

    -- Subtask fields
    subtask_order INTEGER, -- Order within parent task
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Task dependency

    -- Google integration
    google_task_id TEXT, -- ID in Google Tasks
    google_calendar_event_id TEXT, -- ID of calendar event for this task

    -- AI breakdown tracking
    ai_generated BOOLEAN NOT NULL DEFAULT false, -- Was this task/subtask AI-generated?
    ai_breakdown_cache_key TEXT, -- Cache key for AI breakdown results

    -- Metadata (flexible)
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete

    CONSTRAINT estimated_duration_positive CHECK (estimated_duration_minutes > 0),
    CONSTRAINT valid_scheduled_times CHECK (
        (is_scheduled = false AND scheduled_start IS NULL AND scheduled_end IS NULL) OR
        (is_scheduled = true AND scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL AND scheduled_end > scheduled_start)
    ),
    CONSTRAINT no_self_reference CHECK (id != parent_task_id)
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_workflow_state_id ON tasks(workflow_state_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_tasks_scheduled ON tasks(is_scheduled, scheduled_start) WHERE is_scheduled = true;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL; -- Active tasks
CREATE INDEX idx_tasks_google_task_id ON tasks(google_task_id) WHERE google_task_id IS NOT NULL;
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL; -- Subtasks
CREATE INDEX idx_tasks_depends_on ON tasks(depends_on_task_id) WHERE depends_on_task_id IS NOT NULL; -- Dependencies

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
    ON tasks
    USING (auth.uid() = user_id);
```

**Metadata JSONB Example:**

```json
{
  "tags": ["work", "urgent"],
  "external_links": ["https://jira.company.com/TASK-123"],
  "subtasks": ["subtask 1", "subtask 2"],
  "completion_notes": "Completed early due to...",
  "synced_from": "google_tasks",
  "last_google_sync": "2026-02-17T10:30:00Z"
}
```

---

### 5. workflow_states

Custom workflow states (like Jira statuses).

```sql
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT, -- "Bucket" description for AI categorization
    categorization_rules TEXT, -- Natural language rules for auto-categorization
    color TEXT NOT NULL DEFAULT '#6B7280', -- Hex color
    order INTEGER NOT NULL DEFAULT 0, -- Display order
    is_terminal BOOLEAN NOT NULL DEFAULT false, -- End state (e.g., Done, Cancelled)
    should_auto_schedule BOOLEAN NOT NULL DEFAULT true, -- Include in scheduling?
    scheduling_priority_boost INTEGER NOT NULL DEFAULT 0, -- -10 to +10
    priority_weight INTEGER NOT NULL DEFAULT 5, -- 1-10 for AI categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_state_name UNIQUE (user_id, name),
    CONSTRAINT valid_priority_boost CHECK (scheduling_priority_boost BETWEEN -10 AND 10),
    CONSTRAINT valid_priority_weight CHECK (priority_weight BETWEEN 1 AND 10)
);

-- Indexes
CREATE INDEX idx_workflow_states_user_id ON workflow_states(user_id);
CREATE INDEX idx_workflow_states_order ON workflow_states(user_id, order);

-- RLS
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflow states"
    ON workflow_states
    USING (auth.uid() = user_id);
```

**Default States Seed Data:**

```sql
INSERT INTO workflow_states (user_id, name, description, categorization_rules, color, order, is_terminal, scheduling_priority_boost, priority_weight, should_auto_schedule)
VALUES
    ('user-uuid', 'Backlog', 
     'Tasks that are not yet ready to be worked on. Ideas, future work, or tasks lacking necessary information.',
     'Tasks with no immediate deadline OR low priority OR missing dependencies',
     '#9CA3AF', 0, false, -5, 2, false),
    
    ('user-uuid', 'Ready', 
     'Tasks that are ready to be scheduled and worked on. All requirements are met and can be started anytime.',
     'Tasks with deadline > 2 days AND has all dependencies resolved AND priority >= medium',
     '#3B82F6', 1, false, 0, 5, true),
    
    ('user-uuid', 'In Progress', 
     'Tasks currently being worked on. Should have scheduled time blocks on the calendar.',
     'Tasks with scheduled time AND not blocked',
     '#F59E0B', 2, false, 5, 8, true),
    
    ('user-uuid', 'Blocked', 
     'Tasks that cannot proceed due to external dependencies, waiting for information, or blocked by other issues.',
     'Tasks waiting for external input OR missing resources OR dependent on incomplete tasks',
     '#EF4444', 3, false, -10, 1, false),
    
    ('user-uuid', 'Review', 
     'Work is complete and awaiting review, validation, or approval before being marked as done.',
     'Tasks marked complete but requiring review OR approval',
     '#8B5CF6', 4, false, 3, 6, true),
    
    ('user-uuid', 'Done', 
     'Completed tasks. No further action required.',
     'Tasks completed AND approved',
     '#10B981', 5, true, 0, 10, false);
```

---

### 6. workflow_transitions

Automatic state transition rules.

```sql
CREATE TYPE transition_condition_type AS ENUM (
    'deadline_within',      -- Deadline is within X hours/days
    'overdue',             -- Task is past deadline
    'time_in_state',       -- Been in current state for X time
    'manual',              -- User triggered
    'task_completed',      -- Task marked complete
    'scheduled_time_passed' -- Scheduled block has passed
);

CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    to_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    condition_type transition_condition_type NOT NULL,
    condition_value JSONB NOT NULL, -- Flexible condition parameters
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT different_states CHECK (from_state_id != to_state_id)
);

-- Indexes
CREATE INDEX idx_workflow_transitions_user_id ON workflow_transitions(user_id);
CREATE INDEX idx_workflow_transitions_from_state ON workflow_transitions(from_state_id);
CREATE INDEX idx_workflow_transitions_enabled ON workflow_transitions(is_enabled) WHERE is_enabled = true;

-- RLS
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transitions"
    ON workflow_transitions
    USING (auth.uid() = user_id);
```

**Condition Value Examples:**

```json
// Transition to "Urgent" if deadline within 24 hours
{
  "hours_before_deadline": 24,
  "only_on_working_days": true
}

// Transition to "Overdue" if past deadline
{
  "grace_period_hours": 0
}

// Transition to "Backlog" if blocked for 3+ days
{
  "days_in_state": 3,
  "notify_user": true
}
```

---

### 7. task_state_history

Audit trail of state changes.

```sql
CREATE TYPE state_transition_trigger AS ENUM (
    'manual',           -- User changed state
    'automatic',        -- Automatic transition rule
    'system',           -- System-initiated (e.g., task completed)
    'google_sync'       -- Synced from Google Tasks
);

CREATE TABLE task_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_state_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
    to_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE SET NULL,
    trigger_type state_transition_trigger NOT NULL,
    transition_rule_id UUID REFERENCES workflow_transitions(id) ON DELETE SET NULL,
    transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_state_history_task_id ON task_state_history(task_id);
CREATE INDEX idx_task_state_history_transitioned_at ON task_state_history(transitioned_at);

-- RLS
ALTER TABLE task_state_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task history"
    ON task_state_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = task_state_history.task_id
        AND tasks.user_id = auth.uid()
    ));
```

---

### 8. google_calendar_events

Cached Google Calendar events (for availability calculation).

```sql
CREATE TABLE google_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_event_id TEXT NOT NULL,
    calendar_id TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT false,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule TEXT, -- RRULE
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_google_event UNIQUE (user_id, google_event_id),
    CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_google_calendar_events_user_id ON google_calendar_events(user_id);
CREATE INDEX idx_google_calendar_events_time_range ON google_calendar_events(start_time, end_time);
CREATE INDEX idx_google_calendar_events_synced_at ON google_calendar_events(synced_at);

-- RLS
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar events"
    ON google_calendar_events
    USING (auth.uid() = user_id);
```

**Notes:**

- Cached for performance (avoid repeated Google API calls)
- Refreshed periodically (every 5 minutes or via webhook)
- Soft delete: remove events that disappear from Google

---

### 9. scheduling_history

Track scheduling runs for analytics and debugging.

```sql
CREATE TABLE scheduling_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tasks_scheduled INTEGER NOT NULL DEFAULT 0,
    tasks_unscheduled INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL, -- Algorithm execution time
    algorithm_version TEXT NOT NULL DEFAULT '1.0.0',
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}', -- Additional context

    CONSTRAINT duration_positive CHECK (duration_ms >= 0)
);

-- Indexes
CREATE INDEX idx_scheduling_history_user_id ON scheduling_history(user_id);
CREATE INDEX idx_scheduling_history_scheduled_at ON scheduling_history(scheduled_at);

-- RLS
ALTER TABLE scheduling_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduling history"
    ON scheduling_history FOR SELECT
    USING (auth.uid() = user_id);
```

---

### 10. ai_breakdown_cache

Cache AI-generated task breakdown results for performance and cost optimization.

```sql
CREATE TABLE ai_breakdown_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL, -- Hash of task details + max_subtask_duration
    task_title TEXT NOT NULL,
    task_description TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    max_subtask_duration_minutes INTEGER NOT NULL,
    ai_response JSONB NOT NULL, -- Full AI response with subtasks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

    CONSTRAINT unique_cache_key UNIQUE (user_id, cache_key)
);

-- Indexes
CREATE INDEX idx_ai_breakdown_cache_user_id ON ai_breakdown_cache(user_id);
CREATE INDEX idx_ai_breakdown_cache_expires_at ON ai_breakdown_cache(expires_at);
CREATE INDEX idx_ai_breakdown_cache_key ON ai_breakdown_cache(cache_key);

-- RLS
ALTER TABLE ai_breakdown_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI cache"
    ON ai_breakdown_cache
    USING (auth.uid() = user_id);
```

**Cache Key Generation:**

```typescript
// Example cache key: SHA256(title + description + duration + max_subtask)
const cacheKey = crypto
  .createHash('sha256')
  .update(`${title}|${description}|${duration}|${maxSubtask}`)
  .digest('hex');
```

---

### 11. ai_categorization_history

Track AI categorization decisions for learning and user feedback.

```sql
CREATE TABLE ai_categorization_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    suggested_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    confidence NUMERIC(3, 2) NOT NULL, -- 0.00 to 1.00
    reasoning TEXT,
    was_accepted BOOLEAN, -- NULL = pending, true = accepted, false = rejected
    user_chosen_state_id UUID REFERENCES workflow_states(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_confidence CHECK (confidence BETWEEN 0 AND 1)
);

-- Indexes
CREATE INDEX idx_ai_categorization_user_id ON ai_categorization_history(user_id);
CREATE INDEX idx_ai_categorization_task_id ON ai_categorization_history(task_id);
CREATE INDEX idx_ai_categorization_created_at ON ai_categorization_history(created_at);
CREATE INDEX idx_ai_categorization_pending ON ai_categorization_history(was_accepted) WHERE was_accepted IS NULL;

-- RLS
ALTER TABLE ai_categorization_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorization history"
    ON ai_categorization_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own categorization history"
    ON ai_categorization_history FOR UPDATE
    USING (auth.uid() = user_id);
```

**Usage Example:**

```sql
-- Log AI suggestion
INSERT INTO ai_categorization_history (user_id, task_id, suggested_state_id, confidence, reasoning)
VALUES ('user-uuid', 'task-uuid', 'state-uuid', 0.92, 'Task has high priority and deadline within 48 hours');

-- User accepts suggestion
UPDATE ai_categorization_history
SET was_accepted = true
WHERE id = 'history-uuid';

-- User rejects and chooses different state
UPDATE ai_categorization_history
SET was_accepted = false, user_chosen_state_id = 'other-state-uuid'
WHERE id = 'history-uuid';
```

---

### 12. ai_usage_quota

Track AI API usage per user for rate limiting and cost management.

```sql
CREATE TABLE ai_usage_quota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    breakdown_count INTEGER NOT NULL DEFAULT 0,
    categorization_count INTEGER NOT NULL DEFAULT 0,
    total_tokens_used INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_user_date UNIQUE (user_id, date),
    CONSTRAINT non_negative_counts CHECK (
        breakdown_count >= 0 AND 
        categorization_count >= 0 AND 
        total_tokens_used >= 0
    )
);

-- Indexes
CREATE INDEX idx_ai_usage_quota_user_id ON ai_usage_quota(user_id);
CREATE INDEX idx_ai_usage_quota_date ON ai_usage_quota(date);

-- RLS
ALTER TABLE ai_usage_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI quota"
    ON ai_usage_quota FOR SELECT
    USING (auth.uid() = user_id);
```

**Daily Limits:**

- Task breakdowns: 50 per user per day
- Auto-categorizations: 100 per user per day
- Enforced at application layer before making AI requests

---

## Database Functions & Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to other tables with updated_at)
```

### Auto-create default settings

```sql
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_settings_on_signup
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();
```

### Auto-create default workflow states

```sql
CREATE OR REPLACE FUNCTION create_default_workflow_states()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workflow_states (user_id, name, color, "order", is_terminal, scheduling_priority_boost, should_auto_schedule)
    VALUES
        (NEW.id, 'Backlog', '#9CA3AF', 0, false, -5, false),
        (NEW.id, 'Ready', '#3B82F6', 1, false, 0, true),
        (NEW.id, 'In Progress', '#F59E0B', 2, false, 5, true),
        (NEW.id, 'Blocked', '#EF4444', 3, false, -10, false),
        (NEW.id, 'Review', '#8B5CF6', 4, false, 3, true),
        (NEW.id, 'Done', '#10B981', 5, true, 0, false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_workflow_states_on_signup
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workflow_states();
```

---

## Useful Queries

### Get user's availability for a date range

```sql
-- Get all busy times (existing events + scheduled tasks)
WITH busy_times AS (
    SELECT start_time, end_time
    FROM google_calendar_events
    WHERE user_id = 'user-uuid'
    AND start_time BETWEEN '2026-02-17' AND '2026-02-24'

    UNION ALL

    SELECT scheduled_start, scheduled_end
    FROM tasks
    WHERE user_id = 'user-uuid'
    AND is_scheduled = true
    AND scheduled_start BETWEEN '2026-02-17' AND '2026-02-24'
)
SELECT * FROM busy_times
ORDER BY start_time;
```

### Get tasks ready to schedule

```sql
SELECT t.*, ws.name AS state_name, ws.scheduling_priority_boost
FROM tasks t
JOIN workflow_states ws ON t.workflow_state_id = ws.id
WHERE t.user_id = 'user-uuid'
AND t.is_scheduled = false
AND t.deleted_at IS NULL
AND ws.should_auto_schedule = true
ORDER BY
    CASE t.priority
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
    END DESC,
    ws.scheduling_priority_boost DESC,
    t.deadline ASC NULLS LAST;
```

### Check for tasks requiring state transition

```sql
-- Tasks with deadline within 24 hours (should transition to Urgent)
SELECT t.*, wt.to_state_id, ws.name AS target_state
FROM tasks t
JOIN workflow_transitions wt ON t.workflow_state_id = wt.from_state_id
JOIN workflow_states ws ON wt.to_state_id = ws.id
WHERE t.user_id = 'user-uuid'
AND t.deleted_at IS NULL
AND wt.condition_type = 'deadline_within'
AND wt.is_enabled = true
AND t.deadline IS NOT NULL
AND t.deadline <= NOW() + ((wt.condition_value->>'hours_before_deadline')::int * INTERVAL '1 hour');
```

---

## Migration Strategy

### Phase 0 Migrations

```sql
-- 001_create_users.sql
-- 002_create_user_settings.sql
-- 003_create_working_hours.sql
-- 004_create_workflow_states.sql
-- 005_create_tasks.sql
-- 006_create_workflow_transitions.sql
-- 007_create_task_state_history.sql
-- 008_create_google_calendar_events.sql
-- 009_create_scheduling_history.sql
-- 010_create_triggers.sql
-- 011_create_rls_policies.sql
-- 012_seed_test_data.sql (dev only)
```

**Running Migrations:**

```bash
# Using Supabase CLI
supabase db reset # Reset and re-run all migrations
supabase db migrate up # Apply pending migrations
supabase db diff # Generate diff for schema changes
```

---

## Backup & Recovery

### Automated Backups (Supabase)

- **Daily backups:** Automatic (last 7 days)
- **Point-in-time recovery:** Available on Pro plan
- **Export:** Can export to SQL dump

### Manual Backup

```bash
# Export entire database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Backup specific tables
pg_dump -h db.xxx.supabase.co -U postgres -t tasks -t workflow_states > tasks_backup.sql
```

---

## Performance Optimization

### Index Strategy

| Table                  | Column(s)                     | Reason                         |
| ---------------------- | ----------------------------- | ------------------------------ |
| tasks                  | user_id                       | Filter by user (most common)   |
| tasks                  | workflow_state_id             | Join with states               |
| tasks                  | deadline                      | Sort/filter by deadline        |
| tasks                  | is_scheduled, scheduled_start | Find scheduled tasks           |
| google_calendar_events | start_time, end_time          | Range queries for availability |
| task_state_history     | task_id                       | Audit trail lookup             |

### Query Optimization Tips

1. **Use partial indexes** for common filters (e.g., `WHERE deleted_at IS NULL`)
2. **Avoid SELECT \*** - specify columns
3. **Use EXPLAIN ANALYZE** to identify slow queries
4. **Consider materialized views** for complex aggregations
5. **Batch inserts/updates** for Google sync

---

## Security Considerations

### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:

- Users can only access their own data
- `user_id` checked in every policy
- Service role can bypass RLS (for background jobs)

### Data Privacy

- **Soft deletes:** Use `deleted_at` to preserve data
- **Audit trail:** Track who changed what and when
- **Encryption:** Supabase encrypts at rest
- **No PII in logs:** Sanitize error messages

---

## Next Steps

1. ✅ Database schema designed
2. ⬜ Review schema with stakeholders
3. ⬜ Write migration files
4. ⬜ Set up Supabase project
5. ⬜ Apply migrations and test locally
6. ⬜ Begin Phase 0 implementation
