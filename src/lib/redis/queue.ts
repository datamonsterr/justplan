import { Queue, QueueOptions } from "bullmq";
import type { RedisOptions } from "ioredis";

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
function getConnectionOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      "REDIS_URL environment variable is not set. " +
      "For BullMQ, get TCP URL from https://console.upstash.com → Your Database → Connect"
    );
  }

  const isUpstash = redisUrl.startsWith("rediss://");

  // Base options required for BullMQ
  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // Recommended for serverless
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
  const redisUrl = process.env.REDIS_URL;
  const connectionOptions = getConnectionOptions();

  return new Queue(queueName, {
    ...defaultQueueOptions,
    ...options,
    connection: {
      ...connectionOptions,
      // BullMQ will parse the URL and merge with options
      host: new URL(redisUrl!).hostname,
      port: parseInt(new URL(redisUrl!).port || "6379"),
      ...(new URL(redisUrl!).username && {
        username: new URL(redisUrl!).username,
      }),
      ...(new URL(redisUrl!).password && {
        password: new URL(redisUrl!).password,
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
export const workflowTransitionsQueue = createQueue(QueueNames.WORKFLOW_TRANSITIONS);
