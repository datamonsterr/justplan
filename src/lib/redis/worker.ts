import { Worker, Job } from "bullmq";
import type { RedisOptions } from "ioredis";
import { resolveBullMqRedisUrl } from "./config";

/**
 * BullMQ Worker Configuration
 *
 * Helper utilities for creating workers with Upstash Redis TCP compatibility.
 * Workers process jobs from queues asynchronously.
 *
 * Note: BullMQ requires TCP connections (ioredis), not REST API.
 *
 * @see https://docs.bullmq.io/guide/workers
 */

/**
 * Get Redis connection options for workers (TCP-based)
 * Handles both redis:// and rediss:// (TLS) URLs
 */
export function getWorkerConnectionOptions(): RedisOptions {
  const redisUrl = resolveBullMqRedisUrl();

  if (!redisUrl) {
    throw new Error(
      "BullMQ Redis URL is not set. " +
        "Provide REDIS_URL (TCP) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN."
    );
  }

  const isUpstash = redisUrl.startsWith("rediss://");
  const url = new URL(redisUrl);

  // Base configuration
  const baseOptions: RedisOptions = {
    host: url.hostname,
    port: parseInt(url.port || "6379"),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // Recommended for serverless
  };

  // Add authentication if present
  if (url.username) {
    baseOptions.username = url.username;
  }
  if (url.password) {
    baseOptions.password = url.password;
  }

  // Add TLS for Upstash Redis
  if (isUpstash) {
    baseOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  return baseOptions;
}

/**
 * Create a BullMQ worker with Upstash-compatible connection
 *
 * @param queueName - Name of the queue to process
 * @param processor - Job processing function
 * @param options - Additional worker options
 *
 * @example
 * ```ts
 * import { createWorker } from '@/lib/redis/worker';
 *
 * const worker = createWorker('scheduling', async (job) => {
 *   console.log('Processing job:', job.id);
 *   // Process the job
 *   return { success: true };
 * });
 *
 * // Graceful shutdown
 * process.on('SIGTERM', async () => {
 *   await worker.close();
 * });
 * ```
 */
export function createWorker<T = any, R = any>(
  queueName: string,
  processor: (job: Job<T, R>) => Promise<R>,
  options?: Partial<any>
): Worker<T, R> {
  const connection = getWorkerConnectionOptions();

  return new Worker<T, R>(queueName, processor, {
    connection,
    ...options,
  });
}
