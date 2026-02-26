/**
 * AI Module Index
 * Export all AI-related functionality
 */

// Client and core utilities
export * from "./client";

// Schemas
export * from "./schemas";

// Agents
export { 
  TaskBreakdownAgent,
  createTaskBreakdownAgent,
  breakdownTask,
  type TaskBreakdownInput,
  type TaskBreakdownOutput,
} from "./agents/task-breakdown.agent";

export {
  CopilotAgent,
  createCopilotAgent,
  chat,
  type CopilotInput,
  type CopilotOutput,
} from "./agents/copilot.agent";

// Prompts
export {
  getTaskBreakdownSystemPrompt,
  getTaskBreakdownUserPrompt,
  estimateBreakdownCost,
  type TaskBreakdownContext,
} from "./prompts/task-breakdown";
