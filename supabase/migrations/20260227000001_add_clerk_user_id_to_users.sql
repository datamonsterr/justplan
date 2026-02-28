-- Add Clerk identity mapping column for API auth resolution
ALTER TABLE users
ADD COLUMN clerk_user_id TEXT UNIQUE;

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id)
WHERE clerk_user_id IS NOT NULL;

COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user identifier used to map authenticated sessions to internal user UUID';

