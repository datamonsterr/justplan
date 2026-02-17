# Deployment Guide - Vercel

This guide walks you through deploying JustPlan to Vercel with all necessary integrations.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Connected to your Vercel account
3. **Supabase Project**: Production database set up
4. **Google Cloud Console**: OAuth credentials configured
5. **Upstash Account**: Redis instance for production
6. **Google AI Studio**: Gemini API key

---

## Step 1: Prepare Your Repository

Ensure all changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

## Step 2: Connect GitHub to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `justplan` repository
4. Click "Import"

---

## Step 3: Configure Project Settings

### Framework Preset
- Vercel should auto-detect **Next.js**
- Keep default settings:
  - **Build Command**: `pnpm build`
  - **Output Directory**: `.next`
  - **Install Command**: `pnpm install`
  - **Development Command**: `pnpm dev`

### Root Directory
- Leave as `/` (root)

---

## Step 4: Set Up Environment Variables

In the Vercel project settings, add these environment variables:

### Required for All Environments (Production, Preview, Development)

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project → Settings → API
- Copy URL and keys

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/callback
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URI: `https://your-app.vercel.app/auth/callback`
5. Copy Client ID and Secret

**Important:** Update the redirect URI after deployment with your actual Vercel URL!

#### Gemini AI
```bash
GEMINI_API_KEY=your-gemini-api-key
```

**Where to get:**
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Click "Create API Key"
- Copy the key

#### Redis (Upstash)
```bash
REDIS_URL=rediss://default:password@region.upstash.io:6380
```

**Setup:**
1. Go to [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Select region close to your Vercel deployment (e.g., us-east-1)
4. Copy the connection string (TLS enabled)

#### App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Note:** Replace `your-app.vercel.app` with your actual deployment URL after initial deploy.

---

## Step 5: Configure Supabase for Production

### Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**` (wildcard for all routes)

### Run Database Migrations

```bash
# Push local migrations to production Supabase
supabase link --project-ref your-project-ref
supabase db push
```

---

## Step 6: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (typically 2-3 minutes)
3. Click on the deployment URL to view your app

### Initial Deployment Checklist

- [ ] Build completes successfully
- [ ] No build errors in logs
- [ ] App loads at deployment URL
- [ ] Database connection works
- [ ] Google OAuth redirects correctly
- [ ] Redis connection established

---

## Step 7: Post-Deployment Configuration

### Update Environment Variables

After first deployment, update these with your actual Vercel URL:

```bash
NEXT_PUBLIC_APP_URL=https://your-actual-url.vercel.app
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-actual-url.vercel.app/auth/callback
```

### Update Google OAuth Redirect URIs

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Add: `https://your-actual-url.vercel.app/auth/callback`

### Custom Domain (Optional)

1. In Vercel project → Settings → Domains
2. Add your custom domain (e.g., `justplan.com`)
3. Update DNS records as instructed
4. Update environment variables with custom domain
5. Update Supabase and Google OAuth settings

---

## Step 8: Verify Deployment

### Test Core Functionality

1. **Authentication**
   - Visit your app
   - Click "Sign in with Google"
   - Verify successful OAuth flow
   - Check Supabase Auth dashboard for new user

2. **Database**
   - Create a test task
   - Verify it appears in Supabase database
   - Check workflow states load correctly

3. **API Routes**
   - Test task creation/updates
   - Verify server actions work
   - Check API logs in Vercel dashboard

4. **Redis/Queue**
   - Trigger a scheduling action
   - Check Upstash dashboard for activity
   - Verify background jobs execute

---

## Environment-Specific Deployments

### Production Branch
- Branch: `main`
- Auto-deploys on push
- Uses production environment variables

### Preview Deployments
- All other branches and PRs
- Automatic preview URLs
- Can use separate environment variables

### Development
- Local development with `.env.local`
- Use local Supabase (Docker)
- Use local Redis

---

## Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click on latest deployment
3. View:
   - **Build Logs**: Build-time errors
   - **Function Logs**: Runtime errors (Server Actions, API routes)
   - **Runtime Logs**: Request logs

### Common Issues

#### Build Errors

```bash
# Type errors
pnpm type-check

# Lint errors
pnpm lint
```

#### Environment Variable Issues

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Server-only secrets should NOT start with `NEXT_PUBLIC_`
- Redeploy after adding/changing environment variables

#### Database Connection Errors

- Verify Supabase URL and keys are correct
- Check Supabase project is not paused
- Verify SSL/TLS connection settings

#### Redis Connection Errors

- Verify Upstash URL format: `rediss://` (with TLS)
- Check Upstash database is active
- Verify region compatibility

---

## Performance Optimization

### Edge Configuration

Vercel automatically handles:
- ✅ CDN caching for static assets
- ✅ Automatic image optimization
- ✅ Compression (gzip/brotli)
- ✅ HTTP/2 and HTTP/3

### Database Performance

- Use Supabase connection pooling (PgBouncer)
- Enable RLS policies in production
- Add database indexes for common queries

### Caching Strategy

```typescript
// In your API routes or Server Components
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic'; // Disable caching for real-time data
```

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to any branch → Preview deployment
- Pull requests → Preview deployment with unique URL

### Deployment Protection (Optional)

Set up in Vercel Dashboard → Settings → Deployment Protection:
- Password protection for preview deployments
- Vercel Authentication for team access
- Trusted IPs only

---

## Cost Estimation

### Vercel Pricing (as of 2026)

- **Hobby Plan**: Free
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Serverless function execution
  
- **Pro Plan**: $20/month
  - 1 TB bandwidth
  - Advanced analytics
  - Team collaboration

### Estimated Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | Free/Pro | $0-$25 |
| Upstash Redis | Free tier | $0 |
| Google APIs | Free tier | $0 |
| Gemini API | Pay-as-you-go | $5-$20 |
| **Total** | | **$25-$65/month** |

---

## Rollback Strategy

### Instant Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production
4. Instant rollback (no rebuild needed)

### Version Control Rollback

```bash
git revert HEAD
git push origin main
```

---

## Security Checklist

- [ ] All secrets stored in Vercel Environment Variables (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] Supabase RLS policies enabled
- [ ] Google OAuth restricted to your domains
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS headers configured correctly
- [ ] Rate limiting implemented for API routes
- [ ] Gemini API key restricted to your Vercel IP (if possible)

---

## Troubleshooting

### "Build failed" Error

Check build logs for specific errors:
- TypeScript compilation errors
- Missing dependencies
- Environment variable issues

### "Function timeout" Error

Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/scheduling/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Database Connection Issues

- Verify connection pooling enabled in Supabase
- Use `@supabase/ssr` for App Router
- Check firewall rules in Supabase

---

## Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js on Vercel**: [nextjs.org/learn/dashboard-app/deploying-your-application](https://nextjs.org/learn/dashboard-app/deploying-your-application)
- **Supabase + Vercel**: [supabase.com/partners/integrations/vercel](https://supabase.com/partners/integrations/vercel)
- **Vercel Support**: Support tab in dashboard (Pro plan)

---

## Next Steps

1. Set up Vercel Analytics
2. Configure error monitoring (Sentry)
3. Set up uptime monitoring (UptimeRobot)
4. Configure custom domain
5. Set up staging environment
6. Implement CI/CD tests before deployment

---

**Ready to deploy!** 🚀

Push your code to GitHub and follow the steps above to deploy JustPlan to production.
