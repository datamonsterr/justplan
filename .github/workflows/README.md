# GitHub Actions CI/CD

This directory contains automated workflows for continuous integration and deployment.

## Workflows

### 🔄 CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `master`, `main`, or `develop` branches
- Pull requests to these branches

**Jobs:**

1. **Lint & Format** - ESLint + Prettier checks
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Vitest with coverage reports
4. **Build Check** - Next.js production build verification
5. **All Checks** - Final verification that all jobs passed

**Features:**
- Parallel job execution for speed
- Automatic test coverage artifact upload
- Cancels in-progress runs when new commits are pushed
- Node.js 18 with npm caching

### 🎨 Auto Format (`.github/workflows/format.yml`)

**Triggers:**
- Pull requests
- Manual workflow dispatch

**Purpose:**
Automatically formats code with Prettier and commits changes if needed.

**Permissions:**
- Requires `contents: write` and `pull-requests: write`

---

## Running CI Checks Locally

Before pushing, run these commands to catch issues early:

```bash
# Run all CI checks locally
npm run lint              # ESLint
npm run type-check        # TypeScript
npm run test:unit         # Unit tests
npm run build             # Build check

# Or check formatting
npx prettier --check "**/*.{ts,tsx,js,jsx,json,css,md}"

# Auto-fix formatting
npm run format
```

---

## Test Coverage

- Unit tests generate coverage reports
- Coverage artifacts are uploaded to GitHub Actions
- Retention: 7 days

**View coverage locally:**
```bash
npm run test:coverage
open coverage/index.html
```

---

## CI Status

Add these badges to your README:

```markdown
![CI](https://github.com/yourusername/justplan/workflows/CI/badge.svg)
```

---

## Troubleshooting

### CI Fails on Lint

```bash
npm run lint -- --fix
```

### CI Fails on Format

```bash
npm run format
git add .
git commit -m "style: format code"
```

### CI Fails on Tests

```bash
npm run test:unit
# Fix failing tests
```

### CI Fails on Build

```bash
npm run build
# Check for TypeScript or build errors
```

---

## Configuration Files

- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files excluded from formatting
- `tsconfig.json` - TypeScript compiler options
- `vitest.config.ts` - Test configuration

---

## Extending CI

### Add E2E Tests

To run Playwright tests in CI, add to `ci.yml`:

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run test:e2e
```

### Add Security Scanning

```yaml
security:
  name: Security Audit
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm audit --production
```

### Add Deployment

```yaml
deploy:
  name: Deploy to Vercel
  needs: [lint, typecheck, test, build]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Best Practices

1. **Keep CI Fast** - Run tests in parallel
2. **Fail Fast** - Use `cancel-in-progress: true`
3. **Cache Dependencies** - Use `cache: 'npm'` in setup-node
4. **Test Locally First** - Don't rely on CI to catch issues
5. **Monitor Coverage** - Aim for >80% code coverage
6. **Keep Workflows DRY** - Use composite actions for repeated steps

---

## CI Metrics

After setup:
- ✅ 4 test files
- ✅ 47 tests passing
- ✅ 0 linting errors
- ✅ 0 TypeScript errors
- ✅ Production build successful

**Average CI run time:** ~2-3 minutes
