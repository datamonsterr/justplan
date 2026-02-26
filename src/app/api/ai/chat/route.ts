/**
 * AI Chat API (Copilot)
 * POST /api/ai/chat - Chat with AI copilot
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chat } from "@/lib/ai";

// Mock user ID for development
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

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
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();

    // Validate request
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { message, history } = parsed.data;

    // Call copilot agent
    const result = await chat(userId, message, history);

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
    console.error("POST /api/ai/chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
