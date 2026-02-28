/**
 * Google OAuth Callback Route
 * GET: Handle OAuth callback and store tokens
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { resolveDbUserIdFromClerkId } from "@/lib/auth";
import { verifySignedOAuthState } from "@/lib/auth/oauth-state";
import { exchangeCodeForTokens, saveUserTokens } from "@/lib/google";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectWithError(errorCode: string, returnUrl = "/settings") {
  const url = new URL(returnUrl, APP_URL);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

function redirectWithSuccess(returnUrl: string) {
  const url = new URL(returnUrl, APP_URL);
  url.searchParams.set("google_connected", "true");
  return NextResponse.redirect(url);
}

/**
 * GET /api/google/callback
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const stateToken = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      console.error("Google OAuth error:", oauthError);
      return redirectWithError("google_oauth_denied");
    }

    if (!code) {
      return redirectWithError("google_oauth_no_code");
    }

    if (!stateToken) {
      return redirectWithError("google_oauth_no_state");
    }

    const { userId: currentClerkUserId } = await auth();
    if (!currentClerkUserId) {
      return redirectWithError("google_oauth_unauthenticated");
    }

    let state;
    try {
      state = verifySignedOAuthState(stateToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid";
      if (message === "OAuth state expired") {
        return redirectWithError("google_oauth_state_expired");
      }
      return redirectWithError("google_oauth_invalid_state");
    }

    if (state.sub !== currentClerkUserId) {
      return redirectWithError("google_oauth_state_mismatch", state.returnUrl);
    }

    const dbUserId = await resolveDbUserIdFromClerkId(currentClerkUserId);

    const tokens = await exchangeCodeForTokens(code);
    await saveUserTokens(dbUserId, tokens);

    return redirectWithSuccess(state.returnUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return redirectWithError("google_oauth_failed");
  }
}

