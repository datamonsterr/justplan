/**
 * Example Scheduling Worker
 * 
 * This is a template for the scheduling worker that will be implemented in Phase 2.
 * It shows how to use the Redis worker utilities with Upstash Redis.
 * 
 * To run this worker:
 * 1. Ensure REDIS_URL is set in .env
 * 2. Run: tsx watch src/workers/scheduling.worker.ts
 * 
 * @phase Phase 2 - Scheduling Engine
 */

import { createWorker } from "@/lib/redis/worker";
import { Job } from "bullmq";

// Job data interface
interface SchedulingJobData {
  userId: string;
  taskIds: string[];
  priority?: "low" | "medium" | "high";
}

// Job result interface
interface SchedulingJobResult {
  success: boolean;
  scheduled: number;
  failed: number;
  errors?: string[];
}

/**
 * Scheduling job processor
 * 
 * This will contain the logic for:
 * - Calculating optimal task schedule
 * - Respecting user availability
 * - Considering task priorities and dependencies
 * - Updating task scheduled times in database
 */
async function processSchedulingJob(
  job: Job<SchedulingJobData>
): Promise<SchedulingJobResult> {
  const { userId, taskIds, priority = "medium" } = job.data;

  console.log(`📅 Processing scheduling job ${job.id}`);
  console.log(`   User: ${userId}`);
  console.log(`   Tasks: ${taskIds.length}`);
  console.log(`   Priority: ${priority}`);

  // Update job progress
  await job.updateProgress(10);

  try {
    // TODO Phase 2: Implement actual scheduling logic
    // 1. Fetch tasks from database
    // 2. Get user availability
    // 3. Calculate optimal schedule
    // 4. Update tasks with scheduled times
    // 5. Send notifications if needed

    await job.updateProgress(50);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await job.updateProgress(100);

    return {
      success: true,
      scheduled: taskIds.length,
      failed: 0,
    };
  } catch (error) {
    console.error(`❌ Scheduling job ${job.id} failed:`, error);
    
    return {
      success: false,
      scheduled: 0,
      failed: taskIds.length,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Create the worker
const schedulingWorker = createWorker<SchedulingJobData, SchedulingJobResult>(
  "scheduling",
  processSchedulingJob,
  {
    concurrency: 5, // Process 5 scheduling jobs simultaneously
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per 60 seconds
    },
  }
);

// Event handlers
schedulingWorker.on("completed", (job, result) => {
  console.log(`✅ Scheduling job ${job.id} completed`);
  console.log(`   Scheduled: ${result.scheduled} tasks`);
  if (result.failed > 0) {
    console.log(`   Failed: ${result.failed} tasks`);
  }
});

schedulingWorker.on("failed", (job, error) => {
  console.error(`❌ Scheduling job ${job?.id} failed:`, error.message);
});

schedulingWorker.on("progress", (job, progress) => {
  console.log(`⏳ Scheduling job ${job.id} progress: ${progress}%`);
});

schedulingWorker.on("error", (error) => {
  console.error("❌ Scheduling worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down scheduling worker...");
  await schedulingWorker.close();
  console.log("✅ Scheduling worker shut down successfully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down scheduling worker...");
  await schedulingWorker.close();
  console.log("✅ Scheduling worker shut down successfully");
  process.exit(0);
});

console.log("🚀 Scheduling worker started");
console.log("   Queue: scheduling");
console.log("   Concurrency: 5");
console.log("   Redis: " + process.env.REDIS_URL?.split("@")[1] || "Local");
