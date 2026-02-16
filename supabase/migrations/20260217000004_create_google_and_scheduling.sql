-- Create google_calendar_events table
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
    recurrence_rule TEXT,
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

-- Create scheduling_history table
CREATE TABLE scheduling_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tasks_scheduled INTEGER NOT NULL DEFAULT 0,
    tasks_unscheduled INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL,
    algorithm_version TEXT NOT NULL DEFAULT '1.0.0',
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    
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
