const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * Returns true if the request is allowed, false if rate limited.
 */
export function rateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get rate limit headers for the response.
 */
export function rateLimitHeaders(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000,
): Record<string, string> {
  const entry = rateLimitMap.get(key);
  if (!entry) {
    return {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(maxRequests),
    };
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const reset = Math.ceil((entry.resetAt - Date.now()) / 1000);

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
