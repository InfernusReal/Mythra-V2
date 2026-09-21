-- Sub-gate 3 forward migration: per-author continuation and writing-position state.
CREATE TABLE "WritingSessionState" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "activeChapterId" UUID,
  "blockId" VARCHAR(64),
  "cursorOffset" INTEGER,
  "selectionAnchor" INTEGER,
  "selectionHead" INTEGER,
  "scrollTop" INTEGER,
  "contextPanelMode" VARCHAR(32) NOT NULL DEFAULT 'CLOSED',
  "pinIds" JSONB NOT NULL DEFAULT '[]',
  "capturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WritingSessionState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WritingSessionState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WritingSessionState_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WritingSessionState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WritingSessionState_activeChapterId_fkey" FOREIGN KEY ("activeChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WritingSessionState_positions_nonnegative" CHECK (
    ("cursorOffset" IS NULL OR "cursorOffset" >= 0) AND
    ("selectionAnchor" IS NULL OR "selectionAnchor" >= 0) AND
    ("selectionHead" IS NULL OR "selectionHead" >= 0) AND
    ("scrollTop" IS NULL OR "scrollTop" >= 0)
  ),
  CONSTRAINT "WritingSessionState_context_mode_valid" CHECK ("contextPanelMode" IN ('CLOSED', 'CONTEXT', 'PINS')),
  CONSTRAINT "WritingSessionState_pinIds_array" CHECK (jsonb_typeof("pinIds") = 'array' AND jsonb_array_length("pinIds") <= 50)
);
CREATE UNIQUE INDEX "WritingSessionState_userId_projectId_key" ON "WritingSessionState"("userId", "projectId");
CREATE INDEX "WritingSessionState_workspaceId_projectId_idx" ON "WritingSessionState"("workspaceId", "projectId");
CREATE INDEX "WritingSessionState_activeChapterId_idx" ON "WritingSessionState"("activeChapterId");
