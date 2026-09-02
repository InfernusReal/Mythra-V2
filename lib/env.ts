import { z } from "zod";

function environmentBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLocaleLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return value;
  }, z.boolean());
}

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MYTHRA_ENV: z.enum(["local", "preview", "staging", "production"]).default("local"),
  RELEASE_VERSION: z.string().regex(/^[a-zA-Z0-9._-]{1,64}$/).default("development"),
  WORKER_SCHEMA_VERSION: z.coerce.number().int().positive().default(1),
  DATABASE_URL: z.string().min(1),
  AUTH_MODE: z.enum(["development", "oidc"]),
  AUTH_ISSUER: z.string().url().optional(),
  AUTH_AUDIENCE: z.string().min(1).optional(),
  AUTH_JWKS_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32),
  SESSION_KEY_ID: z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/).default("v1"),
  SESSION_PREVIOUS_SECRET: z.string().min(32).optional(),
  SESSION_PREVIOUS_KEY_ID: z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/).optional(),
  ADMIN_RECOVERY_SECRET: z.string().min(32).optional(),
  FEATURE_ADMIN_RECOVERY: environmentBoolean(false),
  FEATURE_OPERATIONAL_ANALYTICS: environmentBoolean(true),
  CANARY_EDITOR_SAVE_PERCENT: z.coerce.number().int().min(0).max(100).default(0),
  DEV_AUTH_SUBJECT: z.string().min(1).optional(),
  DEV_AUTH_EMAIL: z.string().email().optional(),
  DEV_AUTH_NAME: z.string().min(1).optional(),
  APP_ORIGIN: z.string().url(),
  MYTHRA_PRIVATE_STORAGE_ROOT: z.string().min(1).optional(),
  MYTHRA_SCANNER_URL: z.string().url().optional(),
  BILLING_PROVIDER: z.enum(["fixture", "http"]).default("fixture"),
  BILLING_PROVIDER_API_URL: z.string().url().optional(),
  BILLING_PROVIDER_SECRET: z.string().min(32).optional(),
  BILLING_WEBHOOK_SECRET: z.string().min(32).optional(),
  BILLING_CORE_PRICE_REF: z.string().min(1).default("core-usd-monthly-v1"),
  BILLING_INTELLIGENCE_PRICE_REF: z.string().min(1).optional(),
  BILLING_CORE_AMOUNT_USD_CENTS: z.coerce.number().int().positive().default(1500),
  BILLING_INTELLIGENCE_AMOUNT_USD_CENTS: z.coerce.number().int().positive().default(2500),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type AppEnv = z.infer<typeof baseSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): AppEnv {
  const env = baseSchema.parse(source);
  const deployed = env.MYTHRA_ENV !== "local" || env.NODE_ENV === "production";
  if (deployed && env.AUTH_MODE === "development") {
    throw new Error("Development authentication is forbidden in production.");
  }
  if (env.AUTH_MODE === "oidc" && (!env.AUTH_ISSUER || !env.AUTH_AUDIENCE || !env.AUTH_JWKS_URL)) {
    throw new Error("OIDC authentication requires issuer, audience, and JWKS URL.");
  }
  if (env.BILLING_CORE_AMOUNT_USD_CENTS !== 1500 || env.BILLING_INTELLIGENCE_AMOUNT_USD_CENTS !== 2500) {
    throw new Error("The active pricing decision requires Core USD 15 and dormant Intelligence USD 25.");
  }
  if (env.BILLING_PROVIDER === "http" && (!env.BILLING_PROVIDER_API_URL || !env.BILLING_PROVIDER_SECRET || !env.BILLING_WEBHOOK_SECRET)) {
    throw new Error("HTTP billing requires API URL, provider secret, and webhook secret.");
  }
  if (deployed && env.BILLING_PROVIDER !== "http") {
    throw new Error("Fixture billing is forbidden in production.");
  }
  if (deployed && new URL(env.APP_ORIGIN).protocol !== "https:") throw new Error("Deployed APP_ORIGIN must use HTTPS.");
  if (deployed && !/([?&])sslmode=(require|verify-ca|verify-full)(&|$)/u.test(env.DATABASE_URL)) throw new Error("Deployed DATABASE_URL must require TLS.");
  if (env.MYTHRA_ENV === "production" && !env.ADMIN_RECOVERY_SECRET) throw new Error("Production requires an independent admin recovery secret.");
  if (Boolean(env.SESSION_PREVIOUS_SECRET) !== Boolean(env.SESSION_PREVIOUS_KEY_ID)) throw new Error("Session rotation requires both the previous secret and previous key identifier.");
  if (env.SESSION_PREVIOUS_KEY_ID === env.SESSION_KEY_ID) throw new Error("Current and previous session key identifiers must differ.");
  const secrets = [env.SESSION_SECRET, env.SESSION_PREVIOUS_SECRET, env.ADMIN_RECOVERY_SECRET, env.BILLING_PROVIDER_SECRET, env.BILLING_WEBHOOK_SECRET].filter((value): value is string => Boolean(value));
  if (new Set(secrets).size !== secrets.length) throw new Error("Security-sensitive secrets must be independent.");
  return env;
}

let cachedEnv: AppEnv | undefined;
export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
