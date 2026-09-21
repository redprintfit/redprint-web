/**
 * Small in-memory rate limiter for the public brand endpoints.
 *
 * Those routes are unauthenticated, make outbound fetches to whatever
 * URL the caller supplies, and (with a key configured) spend AI tokens.
 * A fixed window per client IP is enough to stop a script from looping
 * on them. State is per server instance, which is the right scope: a
 * burst lands on one instance, and the limit is generous enough that
 * a real visitor never sees it.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const SWEEP_EVERY = 500;
let calls = 0;

export type RateLimit = { limit: number; windowMs: number };

/** Returns `null` when allowed, otherwise the seconds until the window resets. */
export function checkRateLimit(key: string, { limit, windowMs }: RateLimit): number | null {
  const now = Date.now();

  // Opportunistic sweep so idle keys don't accumulate forever.
  if (++calls % SWEEP_EVERY === 0) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (b.count >= limit) return Math.ceil((b.resetAt - now) / 1000);
  b.count++;
  return null;
}

/** Best-effort client IP behind Vercel / any proxy that sets x-forwarded-for. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
