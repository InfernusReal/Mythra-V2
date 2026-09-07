CREATE TABLE "OperationalAlertState" (
  "id" UUID NOT NULL,
  "scopeKey" VARCHAR(128) NOT NULL,
  "workspaceId" UUID,
  "ruleKey" VARCHAR(80) NOT NULL,
  "eventName" VARCHAR(120) NOT NULL,
  "state" VARCHAR(16) NOT NULL DEFAULT 'OK',
  "observed" INTEGER NOT NULL DEFAULT 0,
  "severity" VARCHAR(16) NOT NULL,
  "runbook" VARCHAR(240) NOT NULL,
  "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
  "evaluatedAt" TIMESTAMPTZ(3) NOT NULL,
  "firedAt" TIMESTAMPTZ(3),
  "recoveredAt" TIMESTAMPTZ(3),
  "transitionVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "OperationalAlertState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperationalAlertState_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationalAlertState_state_check" CHECK ("state" IN ('OK', 'FIRING')),
  CONSTRAINT "OperationalAlertState_severity_check" CHECK ("severity" IN ('warning', 'critical')),
  CONSTRAINT "OperationalAlertState_observed_check" CHECK ("observed" >= 0),
  CONSTRAINT "OperationalAlertState_transition_check" CHECK ("transitionVersion" >= 0)
);
CREATE UNIQUE INDEX "OperationalAlertState_scopeKey_ruleKey_key" ON "OperationalAlertState"("scopeKey", "ruleKey");
CREATE INDEX "OperationalAlertState_workspaceId_state_evaluatedAt_idx" ON "OperationalAlertState"("workspaceId", "state", "evaluatedAt" DESC);
CREATE INDEX "OperationalAlertState_ruleKey_state_evaluatedAt_idx" ON "OperationalAlertState"("ruleKey", "state", "evaluatedAt" DESC);

CREATE TABLE "OperationalAlertDelivery" (
  "id" UUID NOT NULL,
  "alertStateId" UUID NOT NULL,
  "transitionVersion" INTEGER NOT NULL,
  "transitionState" VARCHAR(16) NOT NULL,
  "observed" INTEGER NOT NULL,
  "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseOwner" VARCHAR(160),
  "leasedUntil" TIMESTAMPTZ(3),
  "deliveredAt" TIMESTAMPTZ(3),
  "lastErrorCode" VARCHAR(80),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "OperationalAlertDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperationalAlertDelivery_alertStateId_fkey" FOREIGN KEY ("alertStateId") REFERENCES "OperationalAlertState"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationalAlertDelivery_state_check" CHECK ("transitionState" IN ('OK', 'FIRING')),
  CONSTRAINT "OperationalAlertDelivery_status_check" CHECK ("status" IN ('PENDING', 'DELIVERING', 'DELIVERED', 'FAILED')),
  CONSTRAINT "OperationalAlertDelivery_observed_check" CHECK ("observed" >= 0),
  CONSTRAINT "OperationalAlertDelivery_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "OperationalAlertDelivery_transition_check" CHECK ("transitionVersion" > 0)
);
CREATE UNIQUE INDEX "OperationalAlertDelivery_alertStateId_transitionVersion_key" ON "OperationalAlertDelivery"("alertStateId", "transitionVersion");
CREATE INDEX "OperationalAlertDelivery_status_availableAt_idx" ON "OperationalAlertDelivery"("status", "availableAt");
CREATE INDEX "OperationalAlertDelivery_leasedUntil_idx" ON "OperationalAlertDelivery"("leasedUntil");
