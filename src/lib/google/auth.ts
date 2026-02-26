/**
 * Google OAuth Helper
 * Handles token management and authentication
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Initialize Supabase client for token management
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Google OAuth2 client configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

// OAuth2 scopes needed for Calendar and Tasks access
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks.readonly",
  "https://www.googleapis.com/auth/tasks",
];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent", // Force consent to get refresh token
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get user tokens from database
 */
export async function getUserTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("users") as any)
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (error || !data?.google_access_token) {
    return null;
  }

  return {
    accessToken: data.google_access_token,
    refreshToken: data.google_refresh_token || "",
    expiresAt: new Date(data.google_token_expires_at || Date.now()),
  };
}

/**
 * Save user tokens to database
 */
export async function saveUserTokens(
  userId: string,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (tokens.access_token) {
    updateData.google_access_token = tokens.access_token;
  }
  if (tokens.refresh_token) {
    updateData.google_refresh_token = tokens.refresh_token;
  }
  if (tokens.expiry_date) {
    updateData.google_token_expires_at = new Date(tokens.expiry_date).toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("users") as any)
    .update(updateData)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to save tokens: ${error.message}`);
  }
}

/**
 * Clear user tokens (disconnect Google)
 */
export async function clearUserTokens(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("users") as any)
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to clear tokens: ${error.message}`);
  }
}

/**
 * Get authenticated OAuth2 client for a user
 * Automatically refreshes tokens if expired
 */
export async function getAuthenticatedClient(
  userId: string
): Promise<ReturnType<typeof createOAuth2Client> | null> {
  const tokens = await getUserTokens(userId);

  if (!tokens) {
    return null;
  }

  const oauth2Client = createOAuth2Client();

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  // Check if token is expired or will expire in the next 5 minutes
  const isExpired = tokens.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && tokens.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveUserTokens(userId, credentials);
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Failed to refresh Google tokens:", error);
      // Clear invalid tokens
      await clearUserTokens(userId);
      return null;
    }
  }

  return oauth2Client;
}

/**
 * Check if user has connected Google account
 */
export async function isGoogleConnected(userId: string): Promise<boolean> {
  const tokens = await getUserTokens(userId);
  return !!tokens?.accessToken;
}
