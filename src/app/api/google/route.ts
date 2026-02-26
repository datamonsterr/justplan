/**
 * Google OAuth Connect Route
 * GET: Redirect to Google OAuth
 */

import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/google";

// TODO: Replace with actual auth
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET /api/google
 * Start Google OAuth flow
 */
export async function GET() {
  try {
    // Include user ID in state for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: MOCK_USER_ID,
        returnUrl: "/settings",
      })
    ).toString("base64url");

    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start OAuth" },
      { status: 500 }
    );
  }
}
