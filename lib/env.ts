import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_MODE: z.enum(["development", "oidc"]),
  AUTH_ISSUER: z.string().url().optional(),
  AUTH_AUDIENCE: z.string().min(1).optional(),
  AUTH_JWKS_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32),
  DEV_AUTH_SUBJECT: z.string().min(1).optional(),
  DEV_AUTH_EMAIL: z.string().email().optional(),
  DEV_AUTH_NAME: z.string().min(1).optional(),
  APP_ORIGIN: z.string().url(),
  MYTHRA_PRIVATE_STORAGE_ROOT: z.string().min(1).optional(),
  MYTHRA_SCANNER_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type AppEnv = z.infer<typeof baseSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): AppEnv {
  const env = baseSchema.parse(source);
  if (env.NODE_ENV === "production" && env.AUTH_MODE === "development") {
    throw new Error("Development authentication is forbidden in production.");
  }
  if (env.AUTH_MODE === "oidc" && (!env.AUTH_ISSUER || !env.AUTH_AUDIENCE || !env.AUTH_JWKS_URL)) {
    throw new Error("OIDC authentication requires issuer, audience, and JWKS URL.");
  }
  return env;
}

let cachedEnv: AppEnv | undefined;
export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
