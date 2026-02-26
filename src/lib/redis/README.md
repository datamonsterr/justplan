# Redis & BullMQ Configuration

This directory contains Redis client and BullMQ queue/worker configurations optimized for **Upstash Redis REST API** (serverless-friendly).

## Overview

- **Redis Client**: Upstash REST API client (`@upstash/redis`) for all application code
- **BullMQ Queues**: Job queues for background processing (uses TCP via `ioredis`)
- **BullMQ Workers**: Job processors that run asynchronously (uses TCP via `ioredis`)

## Files

- `client.ts` - Upstash REST client + ioredis TCP client for BullMQ
- `queue.ts` - BullMQ queue configuration
- `worker.ts` - BullMQ worker utilities
- `examples.ts` - Comprehensive usage examples
- `index.ts` - Public exports

---

## Setup

### 1. Environment Variables

**Development (`.env`) and Production:**

```bash
# Upstash Redis REST API (for all app code)
UPSTASH_REDIS_REST_URL=your-upstash-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token

# Redis TCP URL (only for BullMQ workers - optional)
REDIS_URL=rediss://default:password@your-region.upstash.io:6380
```

### 2. Get Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Choose region close to your deployment
4. Go to **REST API** tab:
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`
5. (Optional) Go to **Connect** tab:
   - Copy TCP `REDIS_URL` if you need BullMQ workers

**Benefits:**
- ✅ Free tier: 10,000 commands/day
- ✅ Works perfectly in Vercel serverless/edge functions
- ✅ HTTP-based, no TCP connection management
- ✅ Faster cold starts
- ✅ Can be used in client-side code (if needed)

---

## Usage

### Direct Redis Operations (Recommended for App Code)

Uses Upstash REST client - perfect for API routes, Server Actions, and Edge Functions:

```typescript
import { redis } from '@/lib/redis';

// Set/Get values
await redis.set('key', 'value');
const value = await redis.get('key');

// JSON storage
const data = { name: 'John', email: 'john@example.com' };
await redis.set('user:123', JSON.stringify(data));
const user = await redis.get('user:123');

// Counters
await redis.incr('api:requests:count');

// Expiration
await redis.setex('session:token', 3600, 'session-data'); // 1 hour

// See examples.ts for comprehensive usage examples
```

### Background Jobs (BullMQ)

#### Adding Jobs to Queue

```typescript
import { schedulingQueue, googleSyncQueue } from '@/lib/redis';

// Add scheduling job
await schedulingQueue.add('auto-schedule', {
  userId: 'user-123',
  taskIds: ['task-1', 'task-2'],
});

// Add sync job with delay
await googleSyncQueue.add(
  'sync-calendar',
  { userId: 'user-123' },
  { delay: 5000 } // 5 second delay
);

// Add job with priority
await schedulingQueue.add(
  'urgent-schedule',
  { taskId: 'task-1' },
  { priority: 1 } // Higher priority
);
```

#### Creating Workers

Create worker files in `src/workers/`:

```typescript
// src/workers/scheduling.worker.ts
import { createWorker } from '@/lib/redis';
import { Job } from 'bullmq';

interface SchedulingJobData {
  userId: string;
  taskIds: string[];
}

const worker = createWorker<SchedulingJobData>(
  'scheduling',
  async (job: Job<SchedulingJobData>) => {
    console.log('Processing scheduling job:', job.id);
    
    const { userId, taskIds } = job.data;
    
    // Your scheduling logic here
    // ...
    
    return { success: true, scheduled: taskIds.length };
  },
  {
    concurrency: 5, // Process 5 jobs simultaneously
  }
);

// Handle worker events
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
```

#### Running Workers

**Development:**
```bash
# Run worker directly
tsx watch src/workers/scheduling.worker.ts

# Or add to package.json scripts:
"worker:scheduling": "tsx watch src/workers/scheduling.worker.ts"
```

**Production (Vercel):**
- Workers should run as separate processes (not on Vercel serverless functions)
- Options:
  1. **Railway/Render**: Deploy worker as separate service
  2. **Vercel Cron Jobs**: For scheduled tasks
  3. **Upstash QStash**: Serverless queue alternative

---

## Pre-configured Queues

Three queues are exported from `queue.ts`:

### 1. `schedulingQueue`
- **Purpose**: Auto-scheduling tasks
- **Jobs**: `auto-schedule`, `recalculate-schedule`
- **Attempts**: 3 with exponential backoff

### 2. `googleSyncQueue`
- **Purpose**: Google Calendar/Tasks sync
- **Jobs**: `sync-calendar`, `sync-tasks`
- **Attempts**: 5 (more retries for external API)

### 3. `workflowTransitionsQueue`
- **Purpose**: Automatic workflow state changes
- **Jobs**: `check-transitions`, `move-to-in-progress`
- **Attempts**: 3 with exponential backoff

---

## Advanced Configuration

### Custom Queue

```typescript
import { createQueue } from '@/lib/redis';

const customQueue = createQueue('my-queue', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

### Job Options

```typescript
await schedulingQueue.add('job-name', data, {
  priority: 1,        // Higher number = lower priority
  delay: 5000,        // Delay in milliseconds
  attempts: 3,        // Number of retry attempts
  backoff: 2000,      // Delay between retries
  removeOnComplete: true, // Auto-cleanup
  removeOnFail: false,    // Keep failed jobs for debugging
});
```

### Worker Concurrency

```typescript
const worker = createWorker('queue-name', processor, {
  concurrency: 10, // Process 10 jobs at once
  limiter: {
    max: 100,      // Max 100 jobs
    duration: 60000 // Per 60 seconds
  }
});
```

---

## TLS/SSL Configuration

The configuration automatically detects Upstash Redis URLs (`rediss://`) and enables TLS:

```typescript
// Upstash (TLS enabled automatically)
REDIS_URL=rediss://default:password@region.upstash.io:6380

// Local (no TLS)
REDIS_URL=redis://localhost:6379
```

TLS options:
- `rejectUnauthorized: false` - Prevents certificate validation issues with Upstash

---

## Testing

### Unit Tests

```typescript
import { getRedisClient, closeRedisConnection } from '@/lib/redis';

describe('Redis Client', () => {
  afterEach(async () => {
    await closeRedisConnection();
  });

  it('should connect to Redis', async () => {
    const redis = getRedisClient();
    const result = await redis.ping();
    expect(result).toBe('PONG');
  });
});
```

### Integration Tests

```typescript
import { schedulingQueue } from '@/lib/redis';

describe('Scheduling Queue', () => {
  it('should add job to queue', async () => {
    const job = await schedulingQueue.add('test-job', {
      userId: 'test-123',
    });
    
    expect(job.id).toBeDefined();
    expect(job.data.userId).toBe('test-123');
  });
});
```

---

## Monitoring

### Queue Metrics

```typescript
import { schedulingQueue } from '@/lib/redis';

// Get queue counts
const counts = await schedulingQueue.getJobCounts();
console.log('Waiting:', counts.waiting);
console.log('Active:', counts.active);
console.log('Completed:', counts.completed);
console.log('Failed:', counts.failed);

// Get failed jobs
const failed = await schedulingQueue.getFailed();
failed.forEach(job => {
  console.log('Failed job:', job.id, job.failedReason);
});
```

### Health Check API

```typescript
// src/app/api/health/redis/route.ts
import { checkRedisHealth } from '@/lib/redis';

export async function GET() {
  const isHealthy = await checkRedisHealth();
  
  if (!isHealthy) {
    return Response.json(
      { status: 'unhealthy' },
      { status: 503 }
    );
  }
  
  return Response.json({ status: 'healthy' });
}
```

---

## Troubleshooting

### Connection Errors

**Error: `REDIS_URL not set`**
- Ensure environment variable is set in `.env` or Vercel

**Error: `Connection timeout`**
- Check if Redis URL is correct
- Verify firewall rules (Upstash has none by default)

**Error: `TLS handshake failed`**
- Ensure URL starts with `rediss://` for Upstash
- Check `tls.rejectUnauthorized` is set to `false`

### Job Processing Issues

**Jobs stuck in waiting state:**
- Ensure worker is running
- Check worker connection to Redis
- Verify queue name matches

**Jobs failing repeatedly:**
- Check error logs in worker event handlers
- Increase `attempts` in job options
- Add error handling in job processor

---

## Best Practices

1. **Use separate connections for workers**
   - Each worker creates its own connection (handled automatically)

2. **Close connections in tests**
   - Use `closeRedisConnection()` in `afterEach()`

3. **Handle worker errors gracefully**
   - Always add event listeners for `failed` events

4. **Set job timeouts**
   - Prevent jobs from running indefinitely

5. **Monitor queue sizes**
   - Alert if queue grows too large

6. **Use job priorities**
   - Prioritize critical operations

7. **Clean up completed jobs**
   - Use `removeOnComplete` to prevent memory growth

---

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Upstash Redis](https://upstash.com/docs/redis)
- [Redis Commands](https://redis.io/commands)
