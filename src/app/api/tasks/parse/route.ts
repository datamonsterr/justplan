/**
 * Task Parse API
 * POST /api/tasks/parse - Parse task input using bracket notation
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { internalErrorResponse, invalidRequestResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { parseTaskInput } from "@/lib/task-parser";

const parseSchema = z.object({
  input: z.string().min(1, "Input is required"),
});

export async function POST(request: Request) {
  try {
    await requireApiUser();

    const body = await request.json();
    const parsed = parseSchema.safeParse(body);

    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const result = parseTaskInput(parsed.data.input);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          suggestions: result.suggestions,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/tasks/parse error:", error);
    return internalErrorResponse();
  }
}
