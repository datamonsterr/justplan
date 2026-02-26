/**
 * Base Agent Class
 * Provides common patterns for AI agents (error handling, logging, tracking)
 */

import { TokenUsage, AIResult } from "../client";

export interface AgentContext {
  userId: string;
  sessionId?: string;
}

export interface AgentOptions {
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
}

const DEFAULT_OPTIONS: Required<AgentOptions> = {
  maxRetries: 2,
  timeout: 30000,
  debug: process.env.NODE_ENV === "development",
};

/**
 * Abstract base class for AI agents
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected context: AgentContext;
  protected options: Required<AgentOptions>;
  protected totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  constructor(context: AgentContext, options?: AgentOptions) {
    this.context = context;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute the agent's main operation
   */
  abstract execute(input: TInput): Promise<AIResult<TOutput>>;

  /**
   * Log debug information
   */
  protected log(message: string, data?: unknown): void {
    if (this.options.debug) {
      console.log(`[Agent:${this.constructor.name}] ${message}`, data ?? "");
    }
  }

  /**
   * Track token usage
   */
  protected trackUsage(usage: TokenUsage): void {
    this.totalUsage.promptTokens += usage.promptTokens;
    this.totalUsage.completionTokens += usage.completionTokens;
    this.totalUsage.totalTokens += usage.totalTokens;
  }

  /**
   * Get accumulated token usage
   */
  getUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  /**
   * Execute with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.options.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute with timeout
   */
  protected async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = this.options.timeout
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), timeout)
      ),
    ]);
  }
}
