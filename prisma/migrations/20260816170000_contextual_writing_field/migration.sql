CREATE TYPE "ContextCardType" AS ENUM ('CHAPTER_OUTLINE', 'MILESTONE', 'CAUSAL', 'REFERENCE', 'NARRATIVE_INTENT');

CREATE TABLE "ContextPreference" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "mutedTypes" JSONB NOT NULL DEFAULT '[]',
  "directiveEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ContextPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContextPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContextPreference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ContextPin" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "cardType" "ContextCardType" NOT NULL,
  "sourceId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContextPin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContextPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContextPin_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ContextPreference_userId_projectId_key" ON "ContextPreference"("userId", "projectId");
CREATE INDEX "ContextPreference_projectId_updatedAt_idx" ON "ContextPreference"("projectId", "updatedAt" DESC);
CREATE UNIQUE INDEX "ContextPin_userId_projectId_cardType_sourceId_key" ON "ContextPin"("userId", "projectId", "cardType", "sourceId");
CREATE INDEX "ContextPin_projectId_userId_createdAt_idx" ON "ContextPin"("projectId", "userId", "createdAt" DESC);
