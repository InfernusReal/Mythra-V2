CREATE TYPE "SuggestionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'MODIFIED', 'REJECTED', 'INTENTIONAL');

ALTER TYPE "AuditEventKind" ADD VALUE IF NOT EXISTS 'AGENT_TOOL_ACCESS';
ALTER TYPE "AuditEventKind" ADD VALUE IF NOT EXISTS 'SUGGESTION_CHANGE';

ALTER TABLE "Note" ADD COLUMN "toolIdempotencyKey" VARCHAR(80);
CREATE UNIQUE INDEX "Note_projectId_createdById_toolIdempotencyKey_key" ON "Note"("projectId", "createdById", "toolIdempotencyKey");

CREATE TABLE "Suggestion" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "resolvedByUserId" UUID,
  "sourceAgent" VARCHAR(120) NOT NULL,
  "idempotencyKey" VARCHAR(80) NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "targetType" VARCHAR(80),
  "targetId" VARCHAR(128),
  "sourceBlockId" VARCHAR(128),
  "finding" TEXT NOT NULL,
  "evidenceReferences" JSONB NOT NULL DEFAULT '[]',
  "proposedActions" JSONB NOT NULL DEFAULT '[]',
  "confidence" DOUBLE PRECISION,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN',
  "authorNote" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "resolvedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Suggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Suggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Suggestion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Suggestion_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Suggestion_target_pair_check" CHECK (("targetType" IS NULL) = ("targetId" IS NULL)),
  CONSTRAINT "Suggestion_evidence_array_check" CHECK (jsonb_typeof("evidenceReferences") = 'array'),
  CONSTRAINT "Suggestion_actions_array_check" CHECK (jsonb_typeof("proposedActions") = 'array'),
  CONSTRAINT "Suggestion_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)),
  CONSTRAINT "Suggestion_resolution_check" CHECK (("status" = 'OPEN' AND "resolvedAt" IS NULL AND "resolvedByUserId" IS NULL) OR ("status" <> 'OPEN' AND "resolvedAt" IS NOT NULL AND "resolvedByUserId" IS NOT NULL)),
  CONSTRAINT "Suggestion_version_check" CHECK ("version" > 0),
  CONSTRAINT "Suggestion_text_check" CHECK (length(btrim("sourceAgent")) > 0 AND length(btrim("category")) > 0 AND length(btrim("finding")) > 0)
);

CREATE INDEX "Suggestion_workspaceId_projectId_status_createdAt_idx" ON "Suggestion"("workspaceId", "projectId", "status", "createdAt" DESC);
CREATE INDEX "Suggestion_projectId_targetType_targetId_status_idx" ON "Suggestion"("projectId", "targetType", "targetId", "status");
CREATE INDEX "Suggestion_projectId_sourceAgent_createdAt_idx" ON "Suggestion"("projectId", "sourceAgent", "createdAt" DESC);
CREATE UNIQUE INDEX "Suggestion_projectId_sourceAgent_idempotencyKey_key" ON "Suggestion"("projectId", "sourceAgent", "idempotencyKey");
