import { Redis } from "@upstash/redis";
import IORedis, { RedisOptions } from "ioredis";

/**
 * Upstash Redis REST Client
 * 
 * Uses HTTP/REST API instead of TCP - perfect for serverless environments!
 * Works in Vercel Edge Functions, Cloudflare Workers, and browser clients.
 * 
 * Environment Variables:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 * 
 * Get these from: https://console.upstash.com
 * 
 * @example
 * ```ts
 * import { redis } from '@/lib/redis/client';
 * 
 * await redis.set('key', 'value');
 * const value = await redis.get('key');
 * ```
 */

/**
 * Upstash Redis client (REST-based, serverless-friendly)
 * This is the recommended client for all Redis operations in serverless environments.
 */
export const redis = Redis.fromEnv();

/**
 * Get the Upstash Redis client
 * @returns Upstash Redis client instance
 * 
 * @example
 * ```ts
 * const client = getRedisClient();
 * await client.set('foo', 'bar');
 * await client.get('foo'); // 'bar'
 * ```
 */
export function getRedisClient() {
  return redis;
}

/**
 * Health check for Redis connection (REST-based)
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}

// ============================================================================
// ioredis TCP Client (for BullMQ only)
// ============================================================================
// BullMQ requires TCP connections, so we keep ioredis for queue operations
// Regular application code should use the Upstash REST client above
// ============================================================================

let ioredisClient: IORedis | null = null;

/**
 * Parse Redis URL and return ioredis connection options
 * Only used for BullMQ workers
 */
function getIORedisOptions(url: string): RedisOptions {
  const isUpstash = url.startsWith("rediss://");
  
  // Base options required for BullMQ
  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
  
  // Add TLS for Upstash
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
 * Create ioredis connection for BullMQ
 * 
 * Note: This uses TCP connections and requires REDIS_URL environment variable.
 * For regular Redis operations, use the REST client (redis) instead.
 * 
 * @internal Only for BullMQ queue/worker connections
 */
export function createIORedisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      "REDIS_URL environment variable is not set. " +
      "For BullMQ, provide rediss://... URL from Upstash Console (TCP endpoint)."
    );
  }

  const options = getIORedisOptions(redisUrl);
  return new IORedis(redisUrl, options);
}

/**
 * Get or create ioredis client (for BullMQ)
 * @internal
 */
export function getIORedisClient(): IORedis {
  if (ioredisClient) {
    return ioredisClient;
  }

  ioredisClient = createIORedisConnection();
  return ioredisClient;
}

/**
 * Close ioredis connection (for tests)
 * @internal
 */
export async function closeIORedisConnection(): Promise<void> {
  if (ioredisClient) {
    await ioredisClient.quit();
    ioredisClient = null;
  }
}
