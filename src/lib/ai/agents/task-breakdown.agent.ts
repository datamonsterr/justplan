/**
 * Task Breakdown Agent
 * Uses Gemini to break down tasks into subtasks
 */

import { generateObject } from "ai";
import { defaultModel, AIResult } from "../client";
import { taskBreakdownSchema, TaskBreakdown } from "../schemas";
import {
  TaskBreakdownContext,
  getTaskBreakdownSystemPrompt,
  getTaskBreakdownUserPrompt,
} from "../prompts/task-breakdown";
import { BaseAgent, AgentContext, AgentOptions } from "./base.agent";

export interface TaskBreakdownInput {
  taskId: string;
  title: string;
  description?: string;
  estimatedDurationMinutes: number;
  priority: "low" | "medium" | "high";
  deadline?: string;
}

export interface TaskBreakdownOutput extends TaskBreakdown {
  taskId: string;
}

/**
 * Agent that breaks down tasks into actionable subtasks
 */
export class TaskBreakdownAgent extends BaseAgent<
  TaskBreakdownInput,
  TaskBreakdownOutput
> {
  constructor(context: AgentContext, options?: AgentOptions) {
    super(context, options);
  }

  /**
   * Execute task breakdown
   */
  async execute(input: TaskBreakdownInput): Promise<AIResult<TaskBreakdownOutput>> {
    this.log("Starting task breakdown", { taskId: input.taskId, title: input.title });

    try {
      const context: TaskBreakdownContext = {
        title: input.title,
        description: input.description,
        estimatedDuration: input.estimatedDurationMinutes,
        priority: input.priority,
        deadline: input.deadline,
      };

      const result = await this.withTimeout(
        () =>
          this.withRetry(async () => {
            const response = await generateObject({
              model: defaultModel,
              schema: taskBreakdownSchema,
              system: getTaskBreakdownSystemPrompt(),
              prompt: getTaskBreakdownUserPrompt(context),
            });

            return response;
          })
      );

      // Track usage - AI SDK uses inputTokens/outputTokens
      if (result.usage) {
        const usage = {
          promptTokens: result.usage.inputTokens ?? 0,
          completionTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        };
        this.trackUsage(usage);
      }

      this.log("Task breakdown completed", {
        subtaskCount: result.object.subtasks.length,
        totalMinutes: result.object.totalEstimatedMinutes,
      });

      const usage = result.usage ? {
        promptTokens: result.usage.inputTokens ?? 0,
        completionTokens: result.usage.outputTokens ?? 0,
        totalTokens: result.usage.totalTokens ?? 0,
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      return {
        success: true,
        data: {
          ...result.object,
          taskId: input.taskId,
        },
        usage,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Breakdown failed";
      this.log("Task breakdown failed", { error: message });

      return {
        success: false,
        error: message,
      };
    }
  }
}

/**
 * Factory function to create task breakdown agent
 */
export function createTaskBreakdownAgent(
  userId: string,
  options?: AgentOptions
): TaskBreakdownAgent {
  return new TaskBreakdownAgent({ userId }, options);
}

/**
 * Convenience function for one-shot task breakdown
 */
export async function breakdownTask(
  userId: string,
  input: TaskBreakdownInput
): Promise<AIResult<TaskBreakdownOutput>> {
  const agent = createTaskBreakdownAgent(userId);
  return agent.execute(input);
}
