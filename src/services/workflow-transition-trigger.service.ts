import {
  queueWorkflowTransitionEvaluation,
  type WorkflowTransitionJobData,
} from "./workflow-transitions.service";
import { hasBullMqRedisConfig } from "@/lib/redis/config";

let hasWarnedMissingQueueRedisUrl = false;

/**
 * Queue transition evaluation without breaking the caller if Redis is unavailable.
 */
export async function triggerWorkflowTransitionEvaluation(
  input: WorkflowTransitionJobData,
  context: string
) {
  if (!hasBullMqRedisConfig()) {
    if (!hasWarnedMissingQueueRedisUrl) {
      hasWarnedMissingQueueRedisUrl = true;
      console.warn(
        `${context}: skipping workflow transition queue because BullMQ Redis config is missing.`
      );
    }
    return;
  }

  try {
    await queueWorkflowTransitionEvaluation(input);
  } catch (error) {
    console.error(
      `${context}: failed to queue workflow transition evaluation`,
      error
    );
  }
}
