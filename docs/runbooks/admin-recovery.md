# Restricted admin and recovery

The internal surface selects only workspace identity, plan/status, aggregate usage, bounded export/snapshot/outbox jobs, non-content audits and typed operational events. It never selects manuscript, structure/world text, Notes, Captures, search terms/results, filenames, object keys, tokens or URLs.

Recovery is disabled unless its feature flag is explicitly enabled. An OWNER/ADMIN requests a target-bound preview, verifies the fixed impact, types the exact phrase, and submits the short-lived HMAC token. Tokens bind actor, workspace, action, target and preview digest. Completion atomically claims the preview, performs one safe action and writes an `ADMIN_RECOVERY` audit. Expired, altered and replayed tokens fail closed.
