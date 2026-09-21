import type { SessionActor } from "@/domains/accounts/domain/identity";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { FixedWindowRateLimiter, PrismaFixedWindowRateLimiter } from "./rate-limit";

const localLimiters = new Map<number, FixedWindowRateLimiter>();
const durableLimiters = new Map<number, PrismaFixedWindowRateLimiter>();

export async function assertApiRateLimit(actor: SessionActor, routeKey: string, requestedLimit = 120): Promise<void> {
  return assertRateLimitKey(`${actor.workspaceId}:${actor.userId}:${routeKey}`, requestedLimit);
}

export async function assertPublicApiRateLimit(routeKey: string, nonContentSubject: string, requestedLimit: number): Promise<void> {
  return assertRateLimitKey(`public:${routeKey}:${nonContentSubject}`, requestedLimit);
}

async function assertRateLimitKey(key: string, requestedLimit: number): Promise<void> {
  const env = getEnv();
  const limit = env.MYTHRA_ENV === "local" ? Math.max(requestedLimit, 10_000) : requestedLimit;
  if (env.MYTHRA_ENV === "local") {
    const limiter = localLimiters.get(limit) ?? new FixedWindowRateLimiter(limit, 60_000); localLimiters.set(limit, limiter); limiter.assertAllowed(key); return;
  }
  const limiter = durableLimiters.get(limit) ?? new PrismaFixedWindowRateLimiter(getPrisma(), limit, 60_000, logger.child({ module: "rate-limit" })); durableLimiters.set(limit, limiter);
  await limiter.assertAllowed(key);
}
