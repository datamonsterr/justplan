/**
 * Base service patterns and types for JustPlan services
 * Provides consistent error handling and response types
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySupabaseClient = SupabaseClient<any, any, any>;

// ============================================================================
// Response Types
// ============================================================================

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function failure<T>(error: string): ApiResponse<T> {
  return { success: false, data: null, error };
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ApiResponse<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    return failure(`Validation failed: ${errors}`);
  }
  return success(result.data);
}

// ============================================================================
// Database Helpers
// ============================================================================

export async function handleDbOperation<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await operation();
    if (error) {
      return failure(error.message);
    }
    if (data === null) {
      return failure("No data returned");
    }
    return success(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return failure(message);
  }
}

// ============================================================================
// Base Service Class
// ============================================================================

export abstract class BaseService {
  protected supabase: AnySupabaseClient;
  protected userId: string;

  constructor(supabase: AnySupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  protected async executeQuery<T>(
    query: Promise<{ data: T | null; error: { message: string } | null }>
  ): Promise<ApiResponse<T>> {
    return handleDbOperation(() => query);
  }
}

// ============================================================================
// Common Zod Schemas
// ============================================================================

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// ============================================================================
// Type Utilities
// ============================================================================

/** Convert snake_case database row to camelCase */
export function snakeToCamel<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    result[camelKey] = value;
  }
  return result;
}

/** Convert camelCase to snake_case for database insert */
export function camelToSnake<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );
    result[snakeKey] = value;
  }
  return result;
}
