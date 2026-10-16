/**
 * Security helpers: in-memory rate limiting + double-submit CSRF tokens.
 *
 * Notes:
 * - Rate limiting is in-memory (per server instance). For multi-instance
 *   production deployments, back this with Redis or a shared store.
 * - CSRF uses the double-submit cookie pattern: a csrf token cookie is set
 *   by the client page, and the same token must be sent as the
 *   `X-CSRF-Token` header on state-changing API requests.
 */

// In-memory rate limiter: key -> { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per key

/**
 * Check and increment a rate-limit counter. Returns { allowed, remaining }.
 * Throws nothing; callers act on `allowed`.
 */
export function rateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

/** CSRF token length. */
export const CSRF_TOKEN_LENGTH = 32;

/** Generate a random CSRF token. */
export function generateCsrfToken(): string {
  const arr = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate a double-submit CSRF token.
 * `token` = value from the X-CSRF-Token header
 * `cookieToken` = value from the csrf_token cookie
 */
export function validateCsrfToken(token: string | null, cookieToken: string | null): boolean {
  if (!token || !cookieToken) return false;
  if (token !== cookieToken) return false;
  // Constant-time-ish comparison to avoid timing leaks
  if (token.length !== cookieToken.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return diff === 0;
}
