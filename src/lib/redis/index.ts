/**
 * Redis and BullMQ utilities
 * 
 * This module provides:
 * 1. Upstash Redis REST client (for serverless - recommended for all app code)
 * 2. BullMQ queue/worker utilities (TCP-based, for background jobs)
 * 
 * @module lib/redis
 * 
 * @example REST Client (Recommended)
 * ```ts
 * import { redis } from '@/lib/redis';
 * await redis.set('key', 'value');
 * const value = await redis.get('key');
 * ```
 * 
 * @example BullMQ Queue
 * ```ts
 * import { schedulingQueue } from '@/lib/redis';
 * await schedulingQueue.add('job-name', { data: 'value' });
 * ```
 */

// Upstash Redis REST client (recommended for app code)
export {
  redis,
  getRedisClient,
  checkRedisHealth,
} from "./client";

// ioredis TCP client (internal, for BullMQ only)
export {
  createIORedisConnection,
  getIORedisClient,
  closeIORedisConnection,
} from "./client";

// BullMQ queues
export {
  createQueue,
  QueueNames,
  schedulingQueue,
  googleSyncQueue,
  workflowTransitionsQueue,
} from "./queue";

// BullMQ workers
export {
  createWorker,
  getWorkerConnectionOptions,
} from "./worker";
