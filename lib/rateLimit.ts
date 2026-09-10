/**
 * In-memory per-key rate limiting — good enough for a single long-lived Node
 * process. Won't survive a server restart and won't coordinate across
 * multiple instances, so if this app ever moves to a horizontally-scaled or
 * edge deployment (e.g. Cloudflare Workers), this needs to move to a shared
 * store (KV, D1, Durable Object) instead.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

export function checkRateLimit(
  key: string,
  opts?: { maxAttempts?: number; windowMs?: number }
): { allowed: boolean; retryAfterSeconds?: number } {
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

/** Call after a successful attempt so a legitimate user isn't penalized by earlier failures. */
export function resetRateLimit(key: string) {
  attempts.delete(key);
}
