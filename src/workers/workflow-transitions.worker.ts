/**
 * Workflow Transitions Worker
 * Background evaluator for automatic task state transitions
 */

import { Job } from "bullmq";
import { createWorker } from "@/lib/redis/worker";
import {
  evaluateWorkflowTransitions,
  type WorkflowTransitionJobData,
  type WorkflowTransitionJobResult,
} from "@/services/workflow-transitions.service";

async function processWorkflowTransitionJob(
  job: Job<WorkflowTransitionJobData>
): Promise<WorkflowTransitionJobResult> {
  const { userId, taskIds } = job.data;

  console.log(`🔁 Processing workflow transition job ${job.id}`);
  console.log(`   User: ${userId}`);
  if (taskIds?.length) {
    console.log(`   Scoped tasks: ${taskIds.length}`);
  }

  await job.updateProgress(10);
  const result = await evaluateWorkflowTransitions(job.data);
  await job.updateProgress(100);

  console.log(
    `✅ Transition job ${job.id} finished: ${result.transitioned} transitioned / ${result.evaluated} evaluated`
  );
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.join(", ")}`);
  }

  return result;
}

const workflowTransitionsWorker = createWorker<
  WorkflowTransitionJobData,
  WorkflowTransitionJobResult
>("workflow-transitions", processWorkflowTransitionJob, {
  concurrency: 3,
  limiter: {
    max: 20,
    duration: 60000,
  },
});

workflowTransitionsWorker.on("completed", (job, result) => {
  console.log(`✅ Workflow transition job ${job.id} completed`);
  console.log(
    `   Evaluated: ${result.evaluated}, Transitioned: ${result.transitioned}`
  );
});

workflowTransitionsWorker.on("failed", (job, error) => {
  console.error(`❌ Workflow transition job ${job?.id} failed:`, error.message);
});

workflowTransitionsWorker.on("error", (error) => {
  console.error("❌ Workflow transitions worker error:", error);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down workflow transitions worker...");
  await workflowTransitionsWorker.close();
  console.log("✅ Workflow transitions worker shut down successfully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down workflow transitions worker...");
  await workflowTransitionsWorker.close();
  console.log("✅ Workflow transitions worker shut down successfully");
  process.exit(0);
});

console.log("🚀 Workflow transitions worker started");
console.log("   Queue: workflow-transitions");
console.log("   Concurrency: 3");
console.log("   Redis: " + process.env.REDIS_URL?.split("@")[1] || "Local");

export { workflowTransitionsWorker };

