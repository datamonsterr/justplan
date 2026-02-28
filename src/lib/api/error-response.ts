import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "INTERNAL_ERROR";

export interface ApiErrorShape {
  error: string;
  code: ApiErrorCode;
  details?: unknown;
}

export function apiErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return NextResponse.json<ApiErrorShape>(
    {
      error: message,
      code,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

export function unauthenticatedResponse(message = "Authentication required") {
  return apiErrorResponse(401, "UNAUTHENTICATED", message);
}

export function forbiddenResponse(message = "Access denied") {
  return apiErrorResponse(403, "FORBIDDEN", message);
}

export function invalidRequestResponse(message: string, details?: unknown) {
  return apiErrorResponse(400, "INVALID_REQUEST", message, details);
}

export function internalErrorResponse(message = "Internal server error") {
  return apiErrorResponse(500, "INTERNAL_ERROR", message);
}
