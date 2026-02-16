-- Create workflow_states table first (tasks depends on it)
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    "order" INTEGER NOT NULL DEFAULT 0,
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    should_auto_schedule BOOLEAN NOT NULL DEFAULT true,
    scheduling_priority_boost INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_state_name UNIQUE (user_id, name),
    CONSTRAINT valid_priority_boost CHECK (scheduling_priority_boost BETWEEN -10 AND 10)
);

-- Indexes
CREATE INDEX idx_workflow_states_user_id ON workflow_states(user_id);
CREATE INDEX idx_workflow_states_order ON workflow_states(user_id, "order");

-- RLS
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflow states"
    ON workflow_states
    USING (auth.uid() = user_id);

-- Create task_priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    
    -- Google integration
    google_task_id TEXT,
    google_calendar_event_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT estimated_duration_positive CHECK (estimated_duration_minutes > 0),
    CONSTRAINT valid_scheduled_times CHECK (
        (is_scheduled = false AND scheduled_start IS NULL AND scheduled_end IS NULL) OR
        (is_scheduled = true AND scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL AND scheduled_end > scheduled_start)
    )
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_workflow_state_id ON tasks(workflow_state_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_tasks_scheduled ON tasks(is_scheduled, scheduled_start) WHERE is_scheduled = true;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_google_task_id ON tasks(google_task_id) WHERE google_task_id IS NOT NULL;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
    ON tasks
    USING (auth.uid() = user_id);
