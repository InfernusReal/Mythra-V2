# Founder-led launch runbook

## Authority and release boundary

The founder is launch owner until evidence identifies a specialized bottleneck. Release requires green CI and Security on the exact release SHA, a clean migration dry-run, verified backup/restore evidence, production-safe OIDC and billing configuration, content-safe telemetry, and an explicit rollback owner. USD 15 Mythra Core is the only sellable plan. USD 25 Mythra Intelligence is dormant and must not be activated.

## Pre-launch procedure

1. Freeze the release SHA and confirm local and remote equality.
2. Run lint, typecheck, full coverage, production build, full desktop/mobile E2E, launch audit, security tests, dependency audit, every database verifier, migration rollback proof, backup/restore drill, and release-readiness rehearsal.
3. Deploy additive migrations to an isolated production-like clone; verify checksums, counts, ownership constraints, indexes, and adjacent worker-schema compatibility.
4. Verify real production secrets are independent, HTTPS/TLS is enforced, fixture authentication/billing is rejected, storage is private, and admin recovery is disabled unless deliberately enabled.
5. Restore the newest managed backup into an isolated target and compare aggregate fingerprints. Local dump/restore evidence does not substitute for the managed-provider PITR exercise.
6. Canary editor-save changes, observe save failures/latency, conflict rate, outbox lag, database saturation, backup status, export status, auth failure, and storage failure. Promote only while alert rules remain `OK`.
7. Exercise registration, Core checkout/webhook/portal, downgrade readability/exportability, snapshot/safe-copy restore, full export, Capture, Context, Search, causality, and agent-tool denial paths without reading authored content into logs.

## First-ten operations

Recruit only writers meeting `docs/validation/paid-author-validation-plan.md`. Review technical health daily and product evidence weekly. Contact an affected writer only through the authorized support channel; never inspect manuscript text through routine admin tools. Record incidents by safe identifiers, error codes, stage, duration, and outcome.

Rollback or disable the owning feature when there is elevated save failure, possible unrecoverable text loss, cross-workspace exposure, incorrect billing, corrupt export, failed restore, or sustained database/storage saturation. Writing and local recovery remain available when a supporting subsystem degrades. Destructive recovery requires an actor-bound, target-bound, expiring confirmation and an audit record.

## Hiring and expansion discipline

Remain founder-led until a measured bottleneck persists. Hire reliability/backend capacity first for proven durability or scale pressure; product/interaction engineering for verified writing-flow friction; growth/creative distribution only after paid retention; and specialized ML only after Story Intelligence is economically authorized. Do not pre-build integrations, collaboration, publisher workspaces, regional/China-native operations, community, model fine-tuning, or specialized narrative models during V2 validation.
