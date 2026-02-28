/**
 * Google OAuth Connect Route
 * GET: Redirect to Google OAuth
 */

import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/google";
import { internalErrorResponse } from "@/lib/api/error-response";
import { isApiAuthError, requireApiUser, toApiAuthErrorResponse } from "@/lib/auth";
import {
  createSignedOAuthState,
  isSafeRelativeReturnUrl,
} from "@/lib/auth/oauth-state";

/**
 * GET /api/google
 * Start Google OAuth flow
 */
export async function GET(request: Request) {
  try {
    const { clerkUserId } = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const returnUrlCandidate = searchParams.get("returnUrl");
    const returnUrl =
      isSafeRelativeReturnUrl(returnUrlCandidate) ? returnUrlCandidate : "/settings";

    const state = createSignedOAuthState({
      subject: clerkUserId,
      returnUrl,
    });

    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    if (isApiAuthError(error)) {
      return toApiAuthErrorResponse(error);
    }
    console.error("Google OAuth error:", error);
    return internalErrorResponse(
      error instanceof Error ? error.message : "Failed to start OAuth"
    );
  }
}
