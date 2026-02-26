/**
 * Copilot Agent
 * Handles natural language chat interactions
 */

import { generateText } from "ai";
import { defaultModel, AIResult, TokenUsage } from "../client";
import { BaseAgent, AgentContext, AgentOptions } from "./base.agent";

export interface CopilotInput {
  message: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface CopilotOutput {
  response: string;
  suggestedActions?: Array<{
    type: "find_time" | "task_summary" | "reschedule" | "breakdown";
    description: string;
    params?: Record<string, unknown>;
  }>;
}

/**
 * Get the system prompt for the copilot
 */
function getCopilotSystemPrompt(): string {
  return `You are JustPlan's AI assistant. Help users manage tasks and schedules.

You can help with:
1. Finding available time slots for scheduling
2. Providing task summaries and insights  
3. Rescheduling tasks
4. Breaking down complex tasks into subtasks

Be concise and helpful.
Format responses in a friendly, professional tone.
When listing tasks or times, use bullet points for clarity.

If the user asks to do something that requires an action, suggest the action
in your response but don't try to execute it directly.`;
}

/**
 * Copilot agent for natural language interactions
 */
export class CopilotAgent extends BaseAgent<CopilotInput, CopilotOutput> {
  constructor(context: AgentContext, options?: AgentOptions) {
    super(context, options);
  }

  /**
   * Execute copilot chat
   */
  async execute(input: CopilotInput): Promise<AIResult<CopilotOutput>> {
    this.log("Processing copilot message", { message: input.message.slice(0, 50) });

    try {
      // Build messages array
      const messages: Array<{ role: "user" | "assistant"; content: string }> = [
        ...(input.conversationHistory || []),
        { role: "user" as const, content: input.message },
      ];

      const result = await this.withTimeout(
        () =>
          this.withRetry(async () => {
            const response = await generateText({
              model: defaultModel,
              system: getCopilotSystemPrompt(),
              messages,
            });

            return response;
          })
      );

      // Track usage - use safe access
      const usageAny = result.usage as unknown as Record<string, unknown>;
      const usage: TokenUsage = {
        promptTokens: typeof usageAny?.promptTokens === "number" ? usageAny.promptTokens : 0,
        completionTokens: typeof usageAny?.completionTokens === "number" ? usageAny.completionTokens : 0,
        totalTokens: typeof usageAny?.totalTokens === "number" ? usageAny.totalTokens : 0,
      };

      this.trackUsage(usage);

      this.log("Copilot response generated", {
        responseLength: result.text.length,
      });

      return {
        success: true,
        data: {
          response: result.text,
        },
        usage,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Copilot error";
      this.log("Copilot failed", { error: message });

      return {
        success: false,
        error: message,
      };
    }
  }
}

/**
 * Factory function
 */
export function createCopilotAgent(
  userId: string,
  options?: AgentOptions
): CopilotAgent {
  return new CopilotAgent({ userId }, options);
}

/**
 * Convenience function for one-shot chat
 */
export async function chat(
  userId: string,
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AIResult<CopilotOutput>> {
  const agent = createCopilotAgent(userId);
  return agent.execute({ message, conversationHistory: history });
}
