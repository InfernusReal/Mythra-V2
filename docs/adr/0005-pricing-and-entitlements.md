# ADR 0005: Pricing and entitlements

- Status: Accepted
- Decision date: 2026-08-31
- Authority: WorkPlan section 3.1 commercial erratum and Phase 5 Sub-gate 14

## Context

The frozen V2.2 Bible described USD 10 Entry and USD 25 Pro plans before the commercial decision changed. Implementing that table would hide deterministic V2 capabilities behind two non-AI tiers and would conflict with the current product decision.

## Decision

Mythra V2 sells one active plan: **Mythra Core at USD 15 per month**. Core enables every deterministic V2 feature. Its numeric quotas govern measured infrastructure costs rather than prose length or arbitrary creative activity.

**Mythra Intelligence at USD 25 per month is future-only.** V2 reserves the plan and `storyIntelligence` entitlement keys so a later implementation can migrate deliberately, but Intelligence is not sellable, cannot be activated by provider events, carries a zero usage allowance, and makes no product claim in V2.

Amounts, provider price references, provider endpoint and credentials are validated server configuration. The application domain uses a provider-neutral port. Only a configured production HTTP adapter may create live checkout/portal sessions; the deterministic signed fixture adapter is limited to development and tests.

`EntitlementSnapshot` is the sole frontend/backend contract for feature flags, numeric limits, current usage, plan/status and access-through state. Backend guards remain authoritative. No component checks scattered plan-name strings.

The cost dimensions are binary storage, snapshot bytes, revision-storage bytes, export-generation bytes, database-row growth, transfer bandwidth and dormant future-AI units. Plain prose and word count are not quota dimensions.

Quota checks gate creation or high-cost writes. They never gate owned reads or export. Cancellation/downgrade preserves all prose and metadata, uses paid-period/grace state, and never immediately deletes author data. Stable quota failures provide resource, used, limit, requested delta and action.

## Security and privacy

Webhook verification uses the raw request body and a timing-safe HMAC comparison before JSON parsing. Provider event IDs are unique; application is transactional, replay-safe and provider-version ordered. Billing actions require an authenticated OWNER or ADMIN. Logs, audit events, usage records and UI DTOs exclude provider secrets, webhook bodies, invoice line items and author content.

## Consequences

Core can charge through a replaceable adapter without architecture coupling. Future Intelligence requires a new approved gate and migration before it can become active. Regional prices require a later ADR/config expansion; they cannot silently alter this decision. Existing owned work cannot be held hostage by quota or cancellation.
