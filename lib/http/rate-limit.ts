import { errors } from "@/lib/contracts/errors";

interface Bucket { count: number; resetAt: number }

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly limit: number, private readonly windowMs: number) {}

  assertAllowed(key: string, now = Date.now()): void {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }
    if (current.count >= this.limit) throw errors.rateLimited();
    current.count += 1;
  }
}
