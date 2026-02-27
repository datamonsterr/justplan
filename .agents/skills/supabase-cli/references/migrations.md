# Supabase Migrations

Complete guide for database migrations.

## Migration Basics

Migrations are versioned SQL files that track database changes.

### Create Migration

```bash
supabase migration new create_users_table
```

Creates: `supabase/migrations/<timestamp>_create_users_table.sql`

### File Naming

Format: `<timestamp>_<name>.sql`

Example: `20250126120000_create_users_table.sql`

## Writing Migrations

### Example Migration

```sql
-- supabase/migrations/20250126120000_create_users_table.sql

-- Create table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create index
CREATE INDEX idx_users_email ON users(email);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Running Migrations

### Apply Locally

```bash
# Apply pending migrations
supabase migration up

# Reset and apply all
supabase db reset
```

### Push to Remote

```bash
# Link project first
supabase link --project-ref <ref>

# Push migrations
supabase db push

# Preview what would be pushed
supabase db push --dry-run
```

## Auto Schema Diff

Generate migration from Dashboard changes:

### Workflow

1. Make changes in Studio (http://localhost:54323)
2. Generate migration:

```bash
supabase db diff -f my_changes
```

3. Review generated file
4. Apply:

```bash
supabase migration up
```

### Diff Options

```bash
# Specific schemas
supabase db diff -f changes --schema public,extensions

# Against linked remote
supabase db diff --linked

# Against specific database
supabase db diff --db-url "postgresql://..."
```

## Pull Remote Schema

If you made changes in Dashboard:

```bash
supabase db pull
```

Creates migration from remote schema changes.

## Migration Status

```bash
supabase migration list
```

Output:
```
LOCAL          │ REMOTE         │ TIME (UTC)
───────────────┼────────────────┼──────────────────────
               │ 20230103054303 │ 2023-01-03 05:43:03
20230222032233 │ 20230222032233 │ 2023-02-22 03:22:33
20230315120000 │                │ 2023-03-15 12:00:00
```

- Empty LOCAL: Applied remotely, not in local files
- Empty REMOTE: Local migration not yet pushed

## Repair Migration History

Fix out-of-sync history:

```bash
# Mark as applied (insert record)
supabase migration repair 20230103054303 --status applied

# Mark as reverted (delete record)
supabase migration repair 20230103054303 --status reverted

# Preview changes
supabase migration repair 20230103054303 --status reverted --dry-run
```

## Squash Migrations

Combine multiple migrations:

```bash
# Squash all
supabase migration squash

# Squash up to version
supabase migration squash --version 20230315120000
```

## Common Patterns

### Add Column

```sql
-- supabase/migrations/20250126_add_bio.sql
ALTER TABLE users ADD COLUMN bio text;
```

### Modify Column

```sql
-- supabase/migrations/20250126_modify_status.sql
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

### Add Index

```sql
-- supabase/migrations/20250126_add_index.sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

Use `CONCURRENTLY` to avoid table locking.

### Add RLS Policy

```sql
-- supabase/migrations/20250126_add_rls.sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Create Function

```sql
-- supabase/migrations/20250126_create_function.sql
CREATE OR REPLACE FUNCTION search_users(query text)
RETURNS TABLE(id uuid, name text, email text)
LANGUAGE sql STABLE
AS $$
  SELECT id, name, email
  FROM users
  WHERE name ILIKE '%' || query || '%'
     OR email ILIKE '%' || query || '%'
  ORDER BY name;
$$;
```

## Best Practices

### 1. Incremental Changes

```sql
-- DON'T modify existing migrations
-- DO create new migration for changes

-- Bad: Edit 20250101_create_users.sql
-- Good: Create 20250102_add_users_bio.sql
```

### 2. Idempotent Migrations

```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (...);

-- Safe column addition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio text;
  END IF;
END $$;
```

### 3. Include Rollback Strategy

```sql
-- Migration: Add column
ALTER TABLE users ADD COLUMN status text DEFAULT 'active';

-- Rollback (keep as comment):
-- ALTER TABLE users DROP COLUMN status;
```

### 4. Test Locally First

```bash
# Always test migrations
supabase db reset
supabase start

# Verify app works

# Then push
supabase db push
```

### 5. CI/CD Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy Migrations

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: supabase db push
```

## Troubleshooting

### Migration Failed

1. Check error message
2. Fix the migration file
3. Reset and retry:

```bash
supabase db reset
```

### Out of Sync

```bash
# Check status
supabase migration list

# Repair if needed
supabase migration repair <version> --status applied
```

### Rollback

Use `migration down` to rollback applied migrations:

```bash
# Rollback last migration
supabase migration down --count 1

# Rollback last 3 migrations
supabase migration down --count 3

# Preview what would be rolled back
supabase migration down --count 1 --dry-run
```

**Note**: This only works for local database. For remote, options:

1. Create new migration that reverses changes
2. Restore from backup
3. Manually fix in Dashboard and pull
