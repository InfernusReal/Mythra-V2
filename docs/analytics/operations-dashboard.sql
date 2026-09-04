-- Mythra V2 content-safe operations dashboard queries.
-- These queries intentionally read only operational metadata. They must never join
-- manuscript, Capture, Note, Research, Universe text, search documents, or file names.

-- Save, Context, Search, Capture and causal friction percentiles by day.
SELECT
  date_trunc('day', "occurredAt") AS day,
  "eventName",
  COUNT(*) AS samples,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY "durationMs") AS p50_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs") AS p95_ms
FROM "OperationalEvent"
WHERE "eventName" IN (
  'writing.editor_writable', 'writing.first_keystroke', 'writing.save',
  'context.resolve', 'capture.opened', 'search.returned', 'causality.trace'
)
  AND "durationMs" IS NOT NULL
  AND "occurredAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Continue, route-change, Peek/Open and editor-only adoption without authored data.
SELECT
  date_trunc('day', "occurredAt") AS day,
  "eventName",
  COUNT(*) AS event_count,
  COUNT(DISTINCT "workspaceId") AS workspaces,
  COUNT(DISTINCT "projectId") FILTER (WHERE "projectId" IS NOT NULL) AS projects
FROM "OperationalEvent"
WHERE "eventName" IN (
  'continuation.used', 'navigation.route_changed', 'context.peeked',
  'context.opened', 'session.editor_only'
)
  AND "occurredAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Project retention cohorts are derived from writing sessions; no scheduled
-- producer is required and all three intervals remain independently queryable.
WITH activation AS (
  SELECT "projectId", MIN("occurredAt") AS activated_at
  FROM "OperationalEvent"
  WHERE "eventName" = 'writing.save' AND "projectId" IS NOT NULL
  GROUP BY "projectId"
), intervals(days) AS (VALUES (7), (30), (90), (180))
SELECT
  intervals.days AS interval_days,
  COUNT(DISTINCT activation."projectId") FILTER (
    WHERE EXISTS (
      SELECT 1 FROM "OperationalEvent" session
      WHERE session."projectId" = activation."projectId"
        AND session."eventName" = 'session.writing'
        AND session."occurredAt" >= activation.activated_at + make_interval(days => intervals.days)
    )
  ) AS retained_projects
FROM activation
CROSS JOIN intervals
GROUP BY intervals.days
ORDER BY intervals.days;

-- Activation and Uninterrupted Writing Time (UWT). Activation requires both a
-- durable save and a positive writing-session duration for the same project.
WITH project_health AS (
  SELECT
    "workspaceId",
    "projectId",
    bool_or("eventName" = 'writing.save') AS has_durable_save,
    COALESCE(SUM("durationMs") FILTER (WHERE "eventName" = 'session.writing'), 0) AS uwt_ms
  FROM "OperationalEvent"
  WHERE "projectId" IS NOT NULL
    AND "eventName" IN ('writing.save', 'session.writing')
  GROUP BY 1, 2
)
SELECT
  COUNT(*) FILTER (WHERE has_durable_save AND uwt_ms > 0) AS activated_projects,
  COALESCE(SUM(uwt_ms), 0) AS total_uwt_ms
FROM project_health;

-- Project depth uses bounded active-object counts only.
SELECT
  p.id AS project_id,
  (SELECT COUNT(*) FROM "Chapter" c WHERE c."projectId" = p.id AND c."archivedAt" IS NULL) AS chapter_count,
  (SELECT COUNT(*) FROM "StoryEntity" e WHERE e."projectId" = p.id AND e."archivedAt" IS NULL) AS entity_count,
  (SELECT COUNT(*) FROM "Milestone" m WHERE m."projectId" = p.id AND m."archivedAt" IS NULL) AS milestone_count,
  (SELECT COUNT(*) FROM "CausalRelation" r WHERE r."projectId" = p.id AND r."archivedAt" IS NULL) AS causal_relation_count
FROM "Project" p
WHERE p."archivedAt" IS NULL
ORDER BY p.id
LIMIT 1000;

-- Core conversion and dormant Intelligence interest remain separate measures.
SELECT
  (SELECT COUNT(*) FROM "BillingSubscription" WHERE "planKey" = 'CORE' AND "status" IN ('ACTIVE', 'TRIALING')) AS active_core_workspaces,
  (SELECT COUNT(DISTINCT "workspaceId") FROM "OperationalEvent" WHERE "eventName" = 'intelligence.interest') AS intelligence_interest_workspaces;

-- Export/recovery patterns use enum/status/count metadata only.
SELECT "format", "scope", "status", COUNT(*) AS artifact_count, COALESCE(SUM("sizeBytes"), 0) AS total_bytes
FROM "PortabilityArtifact"
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

SELECT "eventName", "safeDimensions"->>'status' AS status, COUNT(*) AS events
FROM "OperationalEvent"
WHERE "eventName" IN ('recovery.incident', 'backup.status', 'export.status', 'job.completed', 'auth.failure', 'storage.failure')
  AND "occurredAt" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1, 2;

-- Paid-validation behavior and coded feedback. `cohortKey` must identify the
-- ten-author paid cohort; feedback values are controlled codes, never prose.
SELECT
  "eventName",
  "safeDimensions"->>'sentimentCode' AS sentiment_code,
  "safeDimensions"->>'reasonCode' AS reason_code,
  COUNT(*) AS events,
  COUNT(DISTINCT "workspaceId") AS paid_writers,
  COUNT(DISTINCT "projectId") FILTER (WHERE "projectId" IS NOT NULL) AS projects
FROM "OperationalEvent"
WHERE "eventName" IN (
  'structure.adopted', 'capture.processed', 'causality.feedback',
  'autosave.trust_feedback', 'core.value_feedback',
  'external_tool.escape', 'intelligence.interest'
)
  AND "safeDimensions"->>'cohortKey' = 'first-paid-ten'
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- Context-navigation reduction and Capture habit are computed from behavior,
-- not survey prose. Distinct active dates prevent repeated clicks inflating habit.
SELECT
  "workspaceId",
  COUNT(*) FILTER (WHERE "eventName" IN ('context.peeked', 'context.opened')) AS context_in_place,
  COUNT(*) FILTER (WHERE "eventName" = 'navigation.route_changed') AS full_navigations,
  COUNT(DISTINCT date_trunc('day', "occurredAt")) FILTER (WHERE "eventName" = 'capture.opened') AS capture_active_days,
  COUNT(*) FILTER (WHERE "eventName" = 'capture.processed') AS captures_processed
FROM "OperationalEvent"
WHERE "occurredAt" >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY "workspaceId";
