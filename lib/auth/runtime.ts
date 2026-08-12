import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthenticateUser } from "@/domains/accounts/application/authenticate";
import type { ExternalAuthAdapter } from "@/domains/accounts/application/ports";
import { DevelopmentAuthAdapter } from "@/domains/accounts/infrastructure/development-auth-adapter";
import { OidcAuthAdapter } from "@/domains/accounts/infrastructure/oidc-auth-adapter";
import { PrismaIdentityRepository } from "@/domains/accounts/infrastructure/prisma-identity-repository";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { noOpMetrics } from "@/lib/observability/metrics";
import { readSessionToken, SESSION_COOKIE } from "./session";

export function createAuthAdapter(): ExternalAuthAdapter {
  const env = getEnv();
  if (env.AUTH_MODE === "development") {
    return new DevelopmentAuthAdapter(
      {
        provider: "development",
        subject: env.DEV_AUTH_SUBJECT ?? "local-author",
        email: env.DEV_AUTH_EMAIL ?? "author@example.test",
        displayName: env.DEV_AUTH_NAME ?? "Local Author",
        emailVerified: true
      },
      env.DEV_AUTH_SUBJECT ?? "local-author"
    );
  }
  return new OidcAuthAdapter(env.AUTH_JWKS_URL!, env.AUTH_ISSUER!, env.AUTH_AUDIENCE!);
}

export function createAuthenticateUser(): AuthenticateUser {
  return new AuthenticateUser(
    createAuthAdapter(),
    new PrismaIdentityRepository(getPrisma()),
    logger.child({ module: "accounts" }),
    noOpMetrics
  );
}

export async function optionalActor(): Promise<SessionActor | null> {
  const env = getEnv();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claimed = readSessionToken(token, env.SESSION_SECRET);
  if (!claimed) return null;
  return new PrismaIdentityRepository(getPrisma()).findActor(
    claimed.userId,
    claimed.workspaceId,
    claimed.sessionId
  );
}

export async function requireActor(): Promise<SessionActor> {
  const actor = await optionalActor();
  if (!actor) redirect("/sign-in");
  return actor;
}
