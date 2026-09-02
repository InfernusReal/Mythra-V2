import { errors } from "@/lib/contracts/errors";
import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { Logger } from "@/lib/observability/logger";

interface Bucket { count: number; resetAt: number }

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly maxBuckets = 10_000) {
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1 || !Number.isInteger(maxBuckets) || maxBuckets < 1) throw new Error("Rate-limit bounds are invalid.");
  }

  assertAllowed(key: string, now = Date.now()): void {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      if (!current && this.buckets.size >= this.maxBuckets) {
        for (const [candidate, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(candidate);
        if (this.buckets.size >= this.maxBuckets) throw errors.rateLimited();
      }
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }
    if (current.count >= this.limit) throw errors.rateLimited();
    current.count += 1;
  }
}

export interface AsyncRateLimiter { assertAllowed(key: string, now?: Date): Promise<{ remaining: number; resetAt: Date }> }

export class PrismaFixedWindowRateLimiter implements AsyncRateLimiter {
  constructor(private readonly prisma: PrismaClient, private readonly limit: number, private readonly windowMs: number, private readonly logger: Logger) {
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1_000) throw new Error("Rate-limit bounds are invalid.");
  }

  async assertAllowed(key: string, now = new Date()): Promise<{ remaining: number; resetAt: Date }> {
    const keyHash = createHash("sha256").update(key).digest("hex");
    const startMs = Math.floor(now.getTime() / this.windowMs) * this.windowMs;
    const windowStart = new Date(startMs);
    const resetAt = new Date(startMs + this.windowMs);
    const rows = await this.prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>(Prisma.sql`
      INSERT INTO "RateLimitBucket" ("keyHash", "count", "limitValue", "windowStart", "resetAt", "updatedAt")
      VALUES (${keyHash}, 1, ${this.limit}, ${windowStart}, ${resetAt}, ${now})
      ON CONFLICT ("keyHash") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1 ELSE LEAST("RateLimitBucket"."count" + 1, ${this.limit + 1}) END,
        "limitValue" = ${this.limit},
        "windowStart" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${windowStart} ELSE "RateLimitBucket"."windowStart" END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimitBucket"."resetAt" END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt"
    `);
    const row = rows[0]; if (!row) throw errors.dependencyUnavailable();
    if (row.count > this.limit) {
      const retry = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1_000));
      // Console trace S16-RATE-002: durable rate rejection records only hashed key, fixed bounds, and retry interval.
      this.logger.warn("security.rate_limited", { step: "S16-RATE-002", keyHash, limit: this.limit, windowMilliseconds: this.windowMs, retryAfterSeconds: retry });
      throw errors.rateLimited(retry);
    }
    // Console trace S16-RATE-001: durable rate acceptance records only hashed key and remaining/reset metadata.
    this.logger.info("security.rate_limit_accepted", { step: "S16-RATE-001", keyHash, limit: this.limit, remaining: this.limit - row.count, resetAt: row.resetAt.toISOString() });
    return { remaining: this.limit - row.count, resetAt: row.resetAt };
  }
}
