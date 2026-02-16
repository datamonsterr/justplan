-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default workflow states for new users
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

-- Trigger to auto-create default workflow states
CREATE TRIGGER create_user_default_workflow_states
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workflow_states();

-- Function to create default user settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id, timezone, week_start_day, default_task_duration_minutes, buffer_time_minutes)
    VALUES (NEW.id, 'UTC', 0, 60, 15);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create default user settings
CREATE TRIGGER create_user_default_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Function to create default working hours for new users (Mon-Fri 9-5)
CREATE OR REPLACE FUNCTION create_default_working_hours()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO working_hours (user_id, day_of_week, start_time, end_time, is_working_day)
    VALUES
        (NEW.id, 0, '00:00', '00:00', false), -- Sunday
        (NEW.id, 1, '09:00', '17:00', true),  -- Monday
        (NEW.id, 2, '09:00', '17:00', true),  -- Tuesday
        (NEW.id, 3, '09:00', '17:00', true),  -- Wednesday
        (NEW.id, 4, '09:00', '17:00', true),  -- Thursday
        (NEW.id, 5, '09:00', '17:00', true),  -- Friday
        (NEW.id, 6, '00:00', '00:00', false); -- Saturday
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create default working hours
CREATE TRIGGER create_user_default_working_hours
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_working_hours();
