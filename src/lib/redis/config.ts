/**
 * Redis config helpers for BullMQ (TCP/ioredis) compatibility.
 */

function unquote(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

/**
 * Resolve BullMQ Redis URL in priority order:
 * 1) REDIS_URL (explicit TCP URL)
 * 2) Derived from UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */
export function resolveBullMqRedisUrl(): string | null {
  const direct = unquote(process.env.REDIS_URL);
  if (direct) {
    return direct;
  }

  const restUrl = unquote(process.env.UPSTASH_REDIS_REST_URL);
  const restToken = unquote(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!restUrl || !restToken) {
    return null;
  }

  try {
    const parsedRest = new URL(restUrl);
    const tcpPort = unquote(process.env.UPSTASH_REDIS_TCP_PORT) || "6380";
    const tcpUrl = new URL(`rediss://${parsedRest.hostname}:${tcpPort}`);
    tcpUrl.username = "default";
    tcpUrl.password = restToken;
    return tcpUrl.toString();
  } catch {
    return null;
  }
}

export function hasBullMqRedisConfig(): boolean {
  return resolveBullMqRedisUrl() !== null;
}
