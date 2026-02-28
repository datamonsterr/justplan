/**
 * AI Chat API (Copilot)
 * POST /api/ai/chat - Chat with AI copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { invalidRequestResponse, internalErrorResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import { chat } from "@/lib/ai";

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

/**
 * POST /api/ai/chat
 * Send a message to the AI copilot
 */
export async function POST(request: NextRequest) {
  try {
    const { dbUserId } = await requireApiUser();

    const body = await request.json();

    // Validate request
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return invalidRequestResponse(
        parsed.error.errors.map((e) => e.message).join(", "),
        parsed.error.errors
      );
    }

    const { message, history } = parsed.data;

    // Call copilot agent
    const result = await chat(dbUserId, message, history);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        response: result.data.response,
        suggestedActions: result.data.suggestedActions,
        usage: result.usage,
      },
    });
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("POST /api/ai/chat error:", error);
    return internalErrorResponse();
  }
}
