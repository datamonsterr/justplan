/**
 * Google Sync Worker
 * Background job processor for Google Calendar/Tasks sync
 * 
 * To run this worker:
 * 1. Ensure REDIS_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET are set
 * 2. Run: tsx watch src/workers/google-sync.worker.ts
 */

import { createWorker } from "@/lib/redis/worker";
import { Job } from "bullmq";
import { performSync, type SyncResult, type SyncOptions } from "@/services/google-sync.service";

// Job data interface
export interface GoogleSyncJobData {
  userId: string;
  syncType: "full" | "calendar" | "tasks";
  daysBack?: number;
  daysForward?: number;
}

// Job result interface
export type GoogleSyncJobResult = SyncResult;

/**
 * Google sync job processor
 */
async function processGoogleSyncJob(
  job: Job<GoogleSyncJobData>
): Promise<GoogleSyncJobResult> {
  const { userId, syncType, daysBack = 7, daysForward = 30 } = job.data;

  console.log(`🔄 Processing Google sync job ${job.id}`);
  console.log(`   User: ${userId}`);
  console.log(`   Type: ${syncType}`);

  await job.updateProgress(10);

  const syncOptions: SyncOptions = {
    userId,
    syncCalendarEvents: syncType === "full" || syncType === "calendar",
    syncGoogleTasks: syncType === "full" || syncType === "tasks",
    daysBack,
    daysForward,
  };

  try {
    await job.updateProgress(20);

    const result = await performSync(syncOptions);

    await job.updateProgress(100);

    console.log(`✅ Sync completed for user ${userId}`);
    console.log(`   Events: ${result.eventsImported} imported, ${result.eventsExported} exported`);
    console.log(`   Tasks: ${result.tasksImported} imported, ${result.tasksExported} exported`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(", ")}`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Google sync job ${job.id} failed:`, error);

    return {
      success: false,
      eventsImported: 0,
      eventsExported: 0,
      tasksImported: 0,
      tasksExported: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      duration: 0,
    };
  }
}

// Create the worker
const googleSyncWorker = createWorker<GoogleSyncJobData, GoogleSyncJobResult>(
  "google-sync",
  processGoogleSyncJob,
  {
    concurrency: 3, // Process 3 sync jobs simultaneously
    limiter: {
      max: 20, // Max 20 jobs
      duration: 60000, // Per minute
    },
  }
);

// Event handlers
googleSyncWorker.on("completed", (job, result) => {
  console.log(`✅ Google sync job ${job.id} completed`);
  console.log(
    `   Events: ${result.eventsImported}↓ ${result.eventsExported}↑`
  );
  console.log(`   Tasks: ${result.tasksImported}↓ ${result.tasksExported}↑`);
  console.log(`   Duration: ${result.duration}ms`);
});

googleSyncWorker.on("failed", (job, error) => {
  console.error(`❌ Google sync job ${job?.id} failed:`, error.message);
});

googleSyncWorker.on("progress", (job, progress) => {
  console.log(`⏳ Google sync job ${job.id} progress: ${progress}%`);
});

googleSyncWorker.on("error", (error) => {
  console.error("❌ Google sync worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down Google sync worker...");
  await googleSyncWorker.close();
  console.log("✅ Google sync worker shut down successfully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down Google sync worker...");
  await googleSyncWorker.close();
  console.log("✅ Google sync worker shut down successfully");
  process.exit(0);
});

console.log("🚀 Google sync worker started");
console.log("   Queue: google-sync");
console.log("   Concurrency: 3");
console.log("   Redis: " + process.env.REDIS_URL?.split("@")[1] || "Local");

export { googleSyncWorker };
