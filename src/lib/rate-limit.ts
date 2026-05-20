/**
 * Simple in-memory rate limiter for API routes.
 * Each instance tracks a separate bucket (e.g., "leads", "reset-code").
 * Not shared across serverless instances — defense in depth, not the only layer.
 */

const buckets = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function rateLimit(
  bucketName: string,
  opts: { maxRequests: number; windowMs: number } = { maxRequests: 5, windowMs: 60_000 }
) {
  if (!buckets.has(bucketName)) buckets.set(bucketName, new Map());
  const map = buckets.get(bucketName)!;

  return {
    check(key: string): { allowed: boolean; remaining: number } {
      const now = Date.now();
      const entry = map.get(key);

      if (!entry || now > entry.resetAt) {
        map.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { allowed: true, remaining: opts.maxRequests - 1 };
      }

      entry.count++;
      const allowed = entry.count <= opts.maxRequests;
      return { allowed, remaining: Math.max(0, opts.maxRequests - entry.count) };
    },
  };
}

/** Extract client IP from request headers */
export function getIP(req: Request): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()) || 'unknown';
}
