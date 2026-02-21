/**
 * Upstash Redis REST Client Usage Examples
 * 
 * This file shows how to use the Upstash Redis REST client in your application.
 * The REST client is serverless-friendly and works in:
 * - Next.js API Routes
 * - Server Actions
 * - Edge Functions
 * - Client-side code (if needed)
 * 
 * @see https://upstash.com/docs/redis/sdks/ts/overview
 */

import { redis } from "@/lib/redis";

// ============================================================================
// Basic Key-Value Operations
// ============================================================================

export async function exampleBasicOperations() {
  // Set a value
  await redis.set("user:123:name", "John Doe");

  // Get a value
  const name = await redis.get("user:123:name");
  console.log(name); // "John Doe"

  // Set with expiration (in seconds)
  await redis.setex("session:abc", 3600, "session-data"); // Expires in 1 hour

  // Set if not exists
  const wasSet = await redis.setnx("lock:task-123", "locked");
  console.log(wasSet); // true or false

  // Delete a key
  await redis.del("user:123:name");

  // Check if key exists
  const exists = await redis.exists("user:123:name");
  console.log(exists); // 0 (doesn't exist) or 1 (exists)
}

// ============================================================================
// JSON Storage (Perfect for TypeScript objects)
// ============================================================================

interface UserPreferences {
  theme: "light" | "dark";
  timezone: string;
  notifications: boolean;
}

export async function exampleJSONStorage() {
  const prefs: UserPreferences = {
    theme: "dark",
    timezone: "America/New_York",
    notifications: true,
  };

  // Store JSON
  await redis.set(`user:123:preferences`, JSON.stringify(prefs));

  // Retrieve JSON
  const stored = await redis.get<string>(`user:123:preferences`);
  if (stored) {
    const parsed: UserPreferences = JSON.parse(stored);
    console.log(parsed.theme); // "dark"
  }

  // Or use a helper function
  await setJSON("user:123:preferences", prefs);
  const retrieved = await getJSON<UserPreferences>("user:123:preferences");
  console.log(retrieved?.theme); // "dark"
}

// Helper functions for JSON
async function setJSON<T>(key: string, value: T, expirySeconds?: number) {
  const json = JSON.stringify(value);
  if (expirySeconds) {
    await redis.setex(key, expirySeconds, json);
  } else {
    await redis.set(key, json);
  }
}

async function getJSON<T>(key: string): Promise<T | null> {
  const value = await redis.get<string>(key);
  return value ? JSON.parse(value) : null;
}

// ============================================================================
// Counters and Increments
// ============================================================================

export async function exampleCounters() {
  // Increment counter
  const apiCalls = await redis.incr("api:requests:count");
  console.log(apiCalls); // 1, 2, 3, ...

  // Increment by amount
  await redis.incrby("downloads:total", 10);

  // Decrement
  await redis.decr("available:seats");

  // Get current value
  const count = await redis.get<number>("api:requests:count");
  console.log(count);
}

// ============================================================================
// Rate Limiting
// ============================================================================

export async function exampleRateLimiting(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const limit = 100; // 100 requests
  const window = 60; // per 60 seconds

  // Increment request count
  const current = await redis.incr(key);

  // Set expiry on first request
  if (current === 1) {
    await redis.expire(key, window);
  }

  // Check if over limit
  if (current > limit) {
    return false; // Rate limited
  }

  return true; // Allowed
}

// ============================================================================
// Caching
// ============================================================================

export async function exampleCaching() {
  const cacheKey = "tasks:user:123";

  // Try to get from cache
  const cached = await getJSON<any[]>(cacheKey);
  if (cached) {
    return cached; // Return cached data
  }

  // If not in cache, fetch from database
  const tasks = await fetchTasksFromDatabase("123");

  // Store in cache for 5 minutes
  await setJSON(cacheKey, tasks, 300);

  return tasks;
}

async function fetchTasksFromDatabase(userId: string) {
  // Your database query here
  return [];
}

// ============================================================================
// Lists (for queues, recent items, etc.)
// ============================================================================

export async function exampleLists() {
  // Push to end of list
  await redis.rpush("notifications:user:123", "New task assigned");
  await redis.rpush("notifications:user:123", "Task completed");

  // Get list length
  const count = await redis.llen("notifications:user:123");
  console.log(count); // 2

  // Get all items
  const all = await redis.lrange("notifications:user:123", 0, -1);
  console.log(all); // ["New task assigned", "Task completed"]

  // Pop from beginning (FIFO queue)
  const notification = await redis.lpop("notifications:user:123");
  console.log(notification); // "New task assigned"

  // Keep only recent N items
  await redis.ltrim("recent:tasks", 0, 99); // Keep last 100
}

// ============================================================================
// Sets (for unique collections)
// ============================================================================

export async function exampleSets() {
  // Add members to set
  await redis.sadd("tags:123", "urgent", "bug", "frontend");

  // Check if member exists
  const hasTag = await redis.sismember("tags:123", "urgent");
  console.log(hasTag); // true

  // Get all members
  const tags = await redis.smembers("tags:123");
  console.log(tags); // ["urgent", "bug", "frontend"]

  // Remove member
  await redis.srem("tags:123", "frontend");

  // Get set size
  const size = await redis.scard("tags:123");
  console.log(size); // 2
}

// ============================================================================
// Sorted Sets (for leaderboards, rankings, time-sorted data)
// ============================================================================

export async function exampleSortedSets() {
  // Add tasks with priority scores
  await redis.zadd("tasks:priority", { score: 100, member: "task-1" });
  await redis.zadd("tasks:priority", { score: 200, member: "task-2" });
  await redis.zadd("tasks:priority", { score: 150, member: "task-3" });

  // Get highest priority tasks
  const topTasks = await redis.zrange("tasks:priority", 0, 9, {
    rev: true, // Reverse order (highest first)
  });
  console.log(topTasks); // ["task-2", "task-3", "task-1"]

  // Get task score
  const score = await redis.zscore("tasks:priority", "task-2");
  console.log(score); // 200

  // Get rank
  const rank = await redis.zrank("tasks:priority", "task-1");
  console.log(rank); // 0 (lowest priority)
}

// ============================================================================
// Hashes (for objects with multiple fields)
// ============================================================================

export async function exampleHashes() {
  // Set multiple fields
  await redis.hset("user:123", {
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
  });

  // Get single field
  const name = await redis.hget("user:123", "name");
  console.log(name); // "John Doe"

  // Get all fields
  const user = await redis.hgetall("user:123");
  console.log(user); // { name: "John Doe", email: "...", role: "admin" }

  // Check if field exists
  const hasEmail = await redis.hexists("user:123", "email");
  console.log(hasEmail); // true

  // Delete field
  await redis.hdel("user:123", "role");
}

// ============================================================================
// Pipeline (Batch Operations)
// ============================================================================

export async function examplePipeline() {
  // Execute multiple commands in one request
  const pipeline = redis.pipeline();

  pipeline.set("key1", "value1");
  pipeline.set("key2", "value2");
  pipeline.incr("counter");
  pipeline.get("key1");

  const results = await pipeline.exec();
  console.log(results); // Array of results
}

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Cache user session data
 */
export async function cacheUserSession(
  sessionId: string,
  userData: any,
  expirySeconds: number = 3600
) {
  await setJSON(`session:${sessionId}`, userData, expirySeconds);
}

/**
 * Track daily active users
 */
export async function trackDailyActiveUser(userId: string) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  await redis.sadd(`dau:${today}`, userId);
  await redis.expire(`dau:${today}`, 86400 * 7); // Keep for 7 days
}

/**
 * Get daily active user count
 */
export async function getDailyActiveUserCount(date: string = "") {
  const targetDate = date || new Date().toISOString().split("T")[0];
  return await redis.scard(`dau:${targetDate}`);
}

/**
 * Cache computation result
 */
export async function getCachedOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  expirySeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getJSON<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute if not cached
  const result = await computeFn();

  // Store in cache
  await setJSON(key, result, expirySeconds);

  return result;
}

/**
 * Debounce function calls using Redis
 */
export async function debounce(
  key: string,
  fn: () => Promise<void>,
  delaySeconds: number = 5
) {
  const lockKey = `debounce:${key}`;

  // Check if already debouncing
  const exists = await redis.exists(lockKey);
  if (exists) {
    return; // Skip this call
  }

  // Set debounce lock
  await redis.setex(lockKey, delaySeconds, "1");

  // Execute function
  await fn();
}
