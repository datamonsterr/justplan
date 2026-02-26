/**
 * Google AI SDK Client Configuration
 * Using Gemini 1.5 Flash for fast, cost-effective AI operations
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Initialize Google AI client with Gemini
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Default model for task operations
export const defaultModel = google("gemini-1.5-flash");

// Model configurations by use case
export const models = {
  // Fast model for quick operations (breakdown, categorization)
  fast: google("gemini-1.5-flash"),
  // More capable model for complex reasoning (future use)
  pro: google("gemini-1.5-pro"),
};

// Token usage tracking (for rate limiting)
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// AI operation result wrapper
export type AIResult<T> =
  | { success: true; data: T; usage: TokenUsage }
  | { success: false; error: string; usage?: TokenUsage };

/**
 * Wrap AI operation with error handling and usage tracking
 */
export async function withAITracking<T>(
  operation: () => Promise<{
    object: T;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }>
): Promise<AIResult<T>> {
  try {
    const result = await operation();
    return {
      success: true,
      data: result.object,
      usage: result.usage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI operation failed";
    console.error("[AI Error]", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Calculate estimated tokens for a prompt (rough estimate)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if within rate limits (placeholder for future implementation)
 */
export async function checkRateLimit(_userId: string): Promise<boolean> {
  // TODO: Implement rate limiting using Redis
  // For now, always allow
  return true;
}
