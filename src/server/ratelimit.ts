import type { Context } from 'hono';

interface Bucket {
  tokens: number;
  updated: number;
}

/** Token bucket per key: `perMinute` requests sustained, same size burst. In-memory; fine for one instance. */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly perMinute: number) {}

  take(key: string, now = Date.now()): boolean {
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.perMinute, updated: now };
      this.buckets.set(key, b);
    }
    const refill = ((now - b.updated) / 60000) * this.perMinute;
    b.tokens = Math.min(this.perMinute, b.tokens + refill);
    b.updated = now;
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    if (this.buckets.size > 5000) this.sweep(now);
    return true;
  }

  private sweep(now: number): void {
    for (const [k, b] of this.buckets) if (now - b.updated > 120000) this.buckets.delete(k);
  }
}

/** Client address behind Railway's proxy: first hop of x-forwarded-for, else a fallback key. */
export function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return c.req.header('x-real-ip') ?? 'local';
}
