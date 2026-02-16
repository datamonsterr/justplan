-- Create users table  
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

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    week_start_day INTEGER NOT NULL DEFAULT 0,
    default_task_duration_minutes INTEGER NOT NULL DEFAULT 60,
    buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
    preferences JSONB DEFAULT '{}',
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

-- Create working_hours table
CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
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
