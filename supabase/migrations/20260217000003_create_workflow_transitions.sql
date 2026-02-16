-- Create transition condition type enum
CREATE TYPE transition_condition_type AS ENUM (
    'deadline_within',
    'overdue',
    'time_in_state',
    'manual',
    'task_completed',
    'scheduled_time_passed'
);

-- Create workflow_transitions table
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    to_state_id UUID NOT NULL REFERENCES workflow_states(id) ON DELETE CASCADE,
    condition_type transition_condition_type NOT NULL,
    condition_value JSONB NOT NULL,
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

-- Create state transition trigger enum
CREATE TYPE state_transition_trigger AS ENUM (
    'manual',
    'automatic',
    'system',
    'google_sync'
);

-- Create task_state_history table
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
