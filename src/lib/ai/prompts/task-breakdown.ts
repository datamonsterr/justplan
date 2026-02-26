/**
 * Task Breakdown Prompt Template
 * Optimized for token efficiency and consistent output
 */

export interface TaskBreakdownContext {
  title: string;
  description?: string;
  estimatedDuration: number;
  priority: "low" | "medium" | "high";
  deadline?: string;
}

/**
 * Generate task breakdown system prompt
 * Kept minimal to reduce token usage
 */
export function getTaskBreakdownSystemPrompt(): string {
  return `You are a task breakdown assistant. Break tasks into 2-10 actionable subtasks.

Rules:
- Each subtask: 5-240 minutes
- Total time ≈ original estimate
- Order by logical sequence
- Be specific and actionable
- Short titles (max 100 chars)`;
}

/**
 * Generate task breakdown user prompt
 */
export function getTaskBreakdownUserPrompt(context: TaskBreakdownContext): string {
  const parts: string[] = [];
  
  parts.push(`Task: ${context.title}`);
  
  if (context.description) {
    // Truncate description to save tokens
    const desc = context.description.length > 200
      ? context.description.slice(0, 200) + "..."
      : context.description;
    parts.push(`Description: ${desc}`);
  }
  
  parts.push(`Duration: ${context.estimatedDuration} minutes`);
  parts.push(`Priority: ${context.priority}`);
  
  if (context.deadline) {
    parts.push(`Deadline: ${context.deadline}`);
  }
  
  parts.push("\nBreak this into subtasks.");
  
  return parts.join("\n");
}

/**
 * Calculate prompt cost estimate (for rate limiting)
 * Gemini 1.5 Flash: ~$0.075/1M input tokens, ~$0.30/1M output tokens
 */
export function estimateBreakdownCost(context: TaskBreakdownContext): {
  inputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
} {
  const systemPrompt = getTaskBreakdownSystemPrompt();
  const userPrompt = getTaskBreakdownUserPrompt(context);
  
  // ~4 chars per token
  const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
  const estimatedOutputTokens = 400; // Typical breakdown response
  
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 0.30;
  
  return {
    inputTokens,
    estimatedOutputTokens,
    estimatedCostUSD: inputCost + outputCost,
  };
}
