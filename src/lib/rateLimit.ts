// In-memory, fixed-window rate limiter — good enough for this app's actual
// deployment (`output: "standalone"`, one long-lived Node process, not
// fan-out serverless). Protects our own routes from being hammered and
// keeps us inside the free-tier quotas of the upstream APIs (MET Norway,
// Open-Meteo, BigDataCloud) we proxy for everyone sharing this server.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow forever across many
// distinct IPs — cheap, doesn't need to be exact.
let checksSinceSweep = 0;
function sweepExpired(now: number) {
  checksSinceSweep += 1;
  if (checksSinceSweep < 200) return;
  checksSinceSweep = 0;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * `now` is injectable for tests; real callers should leave it as
 * `Date.now()`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  sweepExpired(now);

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort caller IP from standard proxy headers; NextRequest.ip only exists on Vercel. */
export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
