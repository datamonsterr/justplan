# Supabase Local Development

Complete guide for local Supabase development.

## Prerequisites

- **Docker**: Required for running local services
- **Docker Compose**: Usually included with Docker Desktop
- **Node.js**: If using NPM installation

## Initial Setup

### 1. Install CLI

```bash
npm install supabase --save-dev
```

### 2. Initialize Project

```bash
npx supabase init
```

Creates directory structure:
```
supabase/
├── config.toml      # Configuration
├── migrations/      # SQL migrations
├── seed.sql         # Seed data
└── functions/       # Edge Functions
```

### 3. Start Local Stack

```bash
npx supabase start
```

First run downloads Docker images (~3-5 minutes).

## Local Services

When running `supabase start`, these services are available:

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:54321 | REST & GraphQL API |
| Studio | http://localhost:54323 | Dashboard UI |
| Database | localhost:54322 | PostgreSQL |
| Inbucket | http://localhost:54324 | Email testing |

## Environment Variables

After starting, get credentials with `supabase status`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Connection

### Direct Connection

```
postgresql://postgres:postgres@localhost:54322/postgres
```

### Using psql

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## Working with Local Database

### Make Schema Changes

1. Open Studio at http://localhost:54323
2. Go to Table Editor
3. Create/modify tables
4. Generate migration:

```bash
supabase db diff -f my_changes
```

### Apply Migration

```bash
supabase migration up
```

### Reset Database

```bash
supabase db reset
```

Drops database, runs all migrations, and seeds.

## Seed Data

Edit `supabase/seed.sql`:

```sql
-- Insert test users
INSERT INTO users (email, name) VALUES
  ('alice@example.com', 'Alice'),
  ('bob@example.com', 'Bob');

-- Insert test posts
INSERT INTO posts (user_id, title) VALUES
  ((SELECT id FROM users WHERE email = 'alice@example.com'), 'First Post'),
  ((SELECT id FROM users WHERE email = 'bob@example.com'), 'Hello World');
```

Seed runs automatically on `supabase db reset`.

## Testing Email

1. Trigger email action (signup, password reset)
2. Open Inbucket at http://localhost:54324
3. View captured emails

## Edge Functions Locally

### Create Function

```bash
supabase functions new hello-world
```

### Serve Functions

```bash
# All functions
supabase functions serve

# With environment variables
supabase functions serve --env-file supabase/.env.local
```

### Test Function

```bash
curl -i --request POST \
  'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer <anon_key>' \
  --header 'Content-Type: application/json' \
  --data '{"name": "Test"}'
```

## Stopping Local Stack

```bash
# Keep database data
supabase stop

# Delete everything
supabase stop --no-backup

# Stop all Supabase instances
supabase stop --all
```

## Linking to Remote

To push local changes to production:

```bash
# Link project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy
```

## Docker Management

### View Containers

```bash
docker ps --filter name=supabase
```

### View Logs

```bash
docker logs supabase_db_<project>
docker logs supabase_auth_<project>
```

### Clean Up

```bash
# Remove all Supabase containers
docker rm -f $(docker ps -aq --filter name=supabase)

# Remove all Supabase volumes
docker volume rm $(docker volume ls -q --filter name=supabase)
```

## Troubleshooting

### Port Conflicts

If ports are in use, modify `config.toml`:

```toml
[api]
port = 54321  # Change to available port

[db]
port = 54322  # Change to available port
```

### Docker Issues

```bash
# Restart Docker
docker restart $(docker ps -q --filter name=supabase)

# Full reset
supabase stop --no-backup
supabase start
```

### Database Connection Refused

1. Check Docker is running
2. Check containers are up: `docker ps`
3. Check port availability: `lsof -i :54322`

## Best Practices

1. **Commit migrations** to version control
2. **Use seed.sql** for test data
3. **Reset regularly** to test migration flow
4. **Generate types** after schema changes
5. **Test locally** before pushing to production
