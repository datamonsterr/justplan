# JustPlan - Quick Start Guide

## 🚀 Project Setup Complete!

Your development environment is ready. Follow these steps to start developing.

---

## 📋 What Was Set Up

✅ **Next.js 14** with TypeScript, App Router, and Tailwind CSS  
✅ **Git Repository** initialized (ready for remote)  
✅ **Supabase** migrations and client setup  
✅ **Complete folder structure** for the project  
✅ **All dependencies** installed

---

## 🔧 Next Steps

### 1. Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your credentials:

```env
# Get these from https://supabase.com/dashboard/project/_/settings/api-keys
# Use the new Publishable Key (sb_publishable_xxx) and Secret Key (sb_secret_xxx)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

# Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis - Use Upstash (https://console.upstash.com)
# For local dev, you can also install Redis: brew install redis (Mac) or apt install redis (Linux)
REDIS_URL=redis://localhost:6379
# Or use Upstash Redis URL:
# REDIS_URL=rediss://default:xxx@xxx.upstash.io:6380

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Set Up Supabase Project

#### Option A: Use Supabase Cloud (Recommended for getting started)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (name: `justplan-dev`)
3. Wait for database provisioning (~2 minutes)
4. Get your credentials:
   - Go to Settings → API
   - Copy `Project URL` and `anon public` key to `.env.local`
   - Copy `service_role` key to `.env.local`
5. Apply migrations:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

#### Option B: Use Local Supabase (For offline development)

```bash
# Install Supabase CLI
pnpm install -g supabase

# Start local Supabase
supabase start

# Note the credentials and add to .env.local
# API URL: http://localhost:54321
# Anon key: (will be printed on start)
# Service role key: (will be printed on start)
```

### 3. Set Up Redis (for Job Queue)

### 3. Set Up Redis (Upstash)

**Use Upstash Redis REST API**

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create account (free tier: 10,000 requests/day)
3. Click "Create Database" → Choose region closest to your Vercel region
4. Get your credentials:
   - Go to **REST API** tab → Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - (Optional) Go to **Connect** tab → Copy `REDIS_URL` if you plan to use BullMQ workers

5. Add to `.env.local`:
   ```bash
   # REST API (for all serverless Redis operations)
   UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-rest-token
   
   # TCP URL (optional, only for BullMQ workers)
   REDIS_URL=rediss://default:password@your-region.upstash.io:6380
   ```

**Why REST API?**
- ✅ Works perfectly in Vercel Edge Functions and serverless
- ✅ No TCP connection management issues
- ✅ Faster cold starts
- ✅ Browser-compatible (can use in client-side code if needed)
- ✅ Built-in connection pooling

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Google Tasks API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain/auth/callback`
5. Copy Client ID and Secret to `.env.local`

### 4. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## � Start Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
justplan/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── ui/                 # UI primitives (Shadcn)
│   │   ├── calendar/           # Calendar components
│   │   ├── tasks/              # Task components
│   │   └── workflows/          # Workflow components
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # Supabase clients
│   │   ├── google/             # Google API integrations
│   │   ├── scheduling/         # Scheduling algorithms
│   │   └── workflows/          # Workflow logic
│   ├── services/               # Data services
│   ├── hooks/                  # Custom React hooks
│   ├── workers/                # Background job workers
│   └── types/                  # TypeScript types
├── supabase/                   # Supabase config & migrations
│   ├── config.toml
│   └── migrations/
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                       # Project documentation
└── .github/                    # GitHub configs & agents
```

---

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking

# Testing
pnpm test             # Run tests in watch mode
pnpm test:unit        # Run unit tests
pnpm test:integration # Run integration tests
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm test:coverage    # Generate coverage report

# Supabase
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:reset   # Reset local database
npm run supabase:push    # Push migrations to remote
npm run supabase:diff    # Generate migration from changes
```

---

## 🎯 Development Workflow

### Starting a Development Session

1. **Start services:**

   ```bash
   # Start Next.js dev server
   pnpm dev
   
   # If using local Redis (optional, start in separate terminal)
   redis-server
   ```

2. **Watch for changes:**
   - Next.js hot-reloads automatically
   - TypeScript compiles on save

3. **Run tests:**
   ```bash
   npm run test
   ```

### Adding a New Feature

1. Create feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Develop feature with tests

3. Test locally:

   ```bash
   npm run test:all
   npm run type-check
   npm run lint
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

---

## 🗄️ Database Management

### View Local Database

When using local Supabase:

- Studio UI: http://localhost:54323
- Database URL: postgresql://postgres:postgres@localhost:54322/postgres

### Create New Migration

```bash
# Generate migration from SQL file
npx supabase migration new your_migration_name

# Edit: supabase/migrations/YYYYMMDDHHMMSS_your_migration_name.sql
# Then push to database
npm run supabase:push
```

### Seed Data

Create `supabase/seed.sql` for test data:

```sql
-- Insert test user
INSERT INTO users (id, email, full_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User');

-- Insert test tasks
INSERT INTO tasks (user_id, title, estimated_duration_minutes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Example Task 1', 60),
  ('00000000-0000-0000-0000-000000000001', 'Example Task 2', 30);
```

Apply seed:

```bash
npx supabase db reset  # Resets DB and runs seed
```

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Supabase Connection Issues

```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start
```

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## 📚 Key Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Google APIs:** https://developers.google.com/workspace
- **Project Docs:** See `docs/` folder for requirements, architecture, etc.

---

## 🤝 Git Workflow (When Ready to Add Remote)

```bash
# Add remote repository
git remote add origin https://github.com/yourusername/justplan.git

# Push to remote
git push -u origin master

# View remotes
git remote -v
```

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] `.env.local` file exists with all credentials
- [ ] Supabase project created and migrations applied
- [ ] Google OAuth credentials configured
- [ ] `npm run dev` starts successfully
- [ ] Can access http://localhost:3000
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Tests pass (`npm run test:unit`)

---

## 🚀 Ready to Code!

Everything is set up! Check out the development plan:

- **Phase 0 (Weeks 1-2):** Foundation & Auth → `docs/02-development-plan.md`
- **Phase 1 (Weeks 3-6):** MVP Core → Task CRUD, Calendar integration
- **Phase 2 (Weeks 7-10):** Auto-scheduling → The magic happens!

Start with authentication in `src/app/auth/` or review `docs/` for full context.

**Happy coding! 🎉**
