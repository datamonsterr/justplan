import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_STATE_TTL_SECONDS = 10 * 60;

interface OAuthStatePayload {
  sub: string;
  returnUrl: string;
  iat: number;
  exp: number;
  nonce: string;
}

function getOAuthStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("Missing OAUTH_STATE_SECRET");
  }
  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getOAuthStateSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function isSafeRelativeReturnUrl(input: string | null | undefined): boolean {
  if (!input || !input.startsWith("/")) {
    return false;
  }

  // Disallow protocol-relative and path traversal-like attempts.
  if (input.startsWith("//") || input.includes("\\") || input.includes("\n") || input.includes("\r")) {
    return false;
  }

  return true;
}

export function createSignedOAuthState(input: {
  subject: string;
  returnUrl: string;
  now?: Date;
  ttlSeconds?: number;
}): string {
  const nowUnix = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_STATE_TTL_SECONDS;

  const payload: OAuthStatePayload = {
    sub: input.subject,
    returnUrl: input.returnUrl,
    iat: nowUnix,
    exp: nowUnix + ttlSeconds,
    nonce: randomBytes(12).toString("base64url"),
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export type VerifiedOAuthState = OAuthStatePayload;

export function verifySignedOAuthState(
  state: string,
  now: Date = new Date()
): VerifiedOAuthState {
  const parts = state.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid OAuth state format");
  }

  const [payloadB64, signatureB64] = parts;

  if (!payloadB64 || !signatureB64) {
    throw new Error("Invalid OAuth state format");
  }

  const expectedSignature = signPayload(payloadB64);
  const received = Buffer.from(signatureB64);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid OAuth state signature");
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64)) as OAuthStatePayload;
  } catch {
    throw new Error("Invalid OAuth state payload");
  }

  if (!payload.sub || !payload.returnUrl || !payload.exp || !payload.iat) {
    throw new Error("Invalid OAuth state payload");
  }

  if (!isSafeRelativeReturnUrl(payload.returnUrl)) {
    throw new Error("Invalid OAuth state return URL");
  }

  const nowUnix = Math.floor(now.getTime() / 1000);
  if (payload.exp < nowUnix) {
    throw new Error("OAuth state expired");
  }

  return payload;
}
