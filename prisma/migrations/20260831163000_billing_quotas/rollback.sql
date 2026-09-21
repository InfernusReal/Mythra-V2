DROP TABLE IF EXISTS "UsageEvent";
DROP TABLE IF EXISTS "BillingWebhookEvent";
DROP TABLE IF EXISTS "BillingSubscription";
DROP TABLE IF EXISTS "BillingCustomer";
DROP TYPE IF EXISTS "UsageResource";
DROP TYPE IF EXISTS "BillingWebhookStatus";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "BillingPlanKey";
DROP TYPE IF EXISTS "BillingProvider";
ALTER TABLE "ExternalIdentity" DROP COLUMN IF EXISTS "emailVerifiedAt";

-- PostgreSQL enum values on AuditEventKind are additive and intentionally retained.
-- Recreating a shared enum during a rollback could invalidate earlier audit rows.
