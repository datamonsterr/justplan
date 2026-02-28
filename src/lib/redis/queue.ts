import { Queue, QueueOptions } from "bullmq";
import type { RedisOptions } from "ioredis";
import { resolveBullMqRedisUrl } from "./config";

/**
 * BullMQ Queue Configuration
 *
 * Creates queues with proper Upstash Redis TCP connection settings.
 *
 * Note: BullMQ requires TCP connections (ioredis), not REST API.
 * For direct Redis operations, use the REST client from client.ts.
 *
 * @see https://docs.bullmq.io/guide/connections
 */

/**
 * Get Redis connection options based on REDIS_URL (TCP)
 * Handles both redis:// and rediss:// (TLS) URLs
 */
let hasWarnedMissingRedisUrl = false;

function resolveRedisUrl(): string {
  const redisUrl = resolveBullMqRedisUrl();
  if (redisUrl) {
    return redisUrl;
  }

  // Do not throw at import time. Falling back keeps API routes loadable in local dev
  // and lets callers decide whether queue operations are optional.
  if (!hasWarnedMissingRedisUrl) {
    hasWarnedMissingRedisUrl = true;
    console.warn(
      "REDIS_URL environment variable is not set. " +
        "Falling back to redis://127.0.0.1:6379 for local development. " +
        "Configure REDIS_URL for production queue processing."
    );
  }

  return "redis://127.0.0.1:6379";
}

function getConnectionOptions(redisUrl: string): RedisOptions {
  const isUpstash = redisUrl.startsWith("rediss://");

  // Base options required for BullMQ
  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // Recommended for serverless
    // Avoid long hangs/retry storms when Redis is unreachable from local dev.
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy: () => null,
  };

  // Add TLS for Upstash Redis
  if (isUpstash) {
    return {
      ...baseOptions,
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  return baseOptions;
}

/**
 * Default queue options for all queues
 */
const defaultQueueOptions: Partial<QueueOptions> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // Start with 1 second
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
};

/**
 * Create a BullMQ queue with Upstash-compatible connection
 *
 * @param queueName - Name of the queue
 * @param options - Additional queue options
 *
 * @example
 * ```ts
 * const schedulingQueue = createQueue('scheduling');
 * await schedulingQueue.add('schedule-task', { taskId: '123' });
 * ```
 */
export function createQueue(
  queueName: string,
  options?: Partial<QueueOptions>
): Queue {
  const redisUrl = resolveRedisUrl();
  const connectionOptions = getConnectionOptions(redisUrl);
  const parsedRedisUrl = new URL(redisUrl);

  return new Queue(queueName, {
    ...defaultQueueOptions,
    ...options,
    connection: {
      ...connectionOptions,
      // BullMQ will parse the URL and merge with options
      host: parsedRedisUrl.hostname,
      port: parseInt(parsedRedisUrl.port || "6379"),
      ...(parsedRedisUrl.username && {
        username: parsedRedisUrl.username,
      }),
      ...(parsedRedisUrl.password && {
        password: parsedRedisUrl.password,
      }),
    },
  });
}

/**
 * Queue names used in the application
 * Centralized to avoid typos
 */
export const QueueNames = {
  SCHEDULING: "scheduling",
  GOOGLE_SYNC: "google-sync",
  WORKFLOW_TRANSITIONS: "workflow-transitions",
} as const;

/**
 * Export pre-configured queues for use throughout the app
 *
 * Usage:
 * ```ts
 * import { schedulingQueue } from '@/lib/redis/queue';
 *
 * await schedulingQueue.add('auto-schedule', {
 *   userId: 'user-123',
 *   taskIds: ['task-1', 'task-2'],
 * });
 * ```
 */

// Scheduling queue for automatic task scheduling
export const schedulingQueue = createQueue(QueueNames.SCHEDULING);

// Google sync queue for Calendar/Tasks synchronization
export const googleSyncQueue = createQueue(QueueNames.GOOGLE_SYNC, {
  defaultJobOptions: {
    attempts: 5, // More retries for external API calls
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Workflow transitions queue for automatic state changes
export const workflowTransitionsQueue = createQueue(
  QueueNames.WORKFLOW_TRANSITIONS
);
