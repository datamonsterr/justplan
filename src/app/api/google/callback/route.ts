/**
 * Google OAuth Callback Route
 * GET: Handle OAuth callback and store tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveUserTokens } from "@/lib/google";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/google/callback
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${APP_URL}/settings?error=google_oauth_denied`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${APP_URL}/settings?error=google_oauth_no_code`
      );
    }

    // Parse state to get user ID
    let userId: string;
    let returnUrl = "/settings";

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        userId = decoded.userId;
        returnUrl = decoded.returnUrl || "/settings";
      } catch {
        return NextResponse.redirect(
          `${APP_URL}/settings?error=google_oauth_invalid_state`
        );
      }
    } else {
      return NextResponse.redirect(
        `${APP_URL}/settings?error=google_oauth_no_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens to database
    await saveUserTokens(userId, tokens);

    // Redirect back with success
    return NextResponse.redirect(
      `${APP_URL}${returnUrl}?google_connected=true`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      `${APP_URL}/settings?error=google_oauth_failed`
    );
  }
}
