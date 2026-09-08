import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import type { MetricsSink } from "@/lib/observability/metrics";
import type {
  NormalizedDomainEvent,
  StoredDomainEvent,
} from "../domain/events";
import type { ProjectionCandidate } from "../domain/projections";
import type { WarningFact } from "../domain/warnings";

export interface ClaimedOutboxEvent extends StoredDomainEvent {
  attempts: number;
  leaseOwner: string;
  leasedUntil: Date;
}

export interface ProjectionBuildResult {
  projectId: string;
  projectStructuralVersion: number;
  projections: ProjectionCandidate[];
  warnings: WarningFact[];
  searchActors: SessionActor[];
  automationCount: number;
  sourceCounts: Readonly<Record<string, number>>;
}

export interface PersistProjectionResult {
  inserted: number;
  updated: number;
  staleRejected: number;
  removed: number;
  warningsActive: number;
  digest: string;
}

export interface LiveModelStatus {
  projectId: string;
  projectStructuralVersion: number;
  projectionCount: number;
  freshCount: number;
  updatingCount: number;
  staleCount: number;
  failedCount: number;
  pendingEventCount: number;
  processingEventCount: number;
  failedEventCount: number;
  oldestPendingAt: string | null;
  lagMilliseconds: number;
  warnings: Array<{
    id: string;
    warningType: string;
    sourceType: string;
    sourceId: string;
    facts: Readonly<Record<string, unknown>>;
    suppressed: boolean;
    suppressible: boolean;
  }>;
  projections: Array<{
    kind: string;
    scopeType: string;
    scopeId: string;
    projectStructuralVersion: number;
    freshness: string;
    generatedAt: string;
  }>;
}

export interface LiveModelRepository {
  claim(
    workerId: string,
    batchSize: number,
    leaseMilliseconds: number,
  ): Promise<ClaimedOutboxEvent[]>;
  deliveryExists(eventId: string): Promise<boolean>;
  build(
    event: NormalizedDomainEvent,
    generatedAt: Date,
  ): Promise<ProjectionBuildResult>;
  persist(
    event: NormalizedDomainEvent,
    build: ProjectionBuildResult,
    fullRebuild: boolean,
  ): Promise<PersistProjectionResult>;
  synchronizeSearch(
    actors: readonly SessionActor[],
    projectId: string,
  ): Promise<{ changed: number; removed: number; sourceCount: number }>;
  completeDuplicate(eventId: string, workerId: string): Promise<void>;
  fail(
    eventId: string,
    workerId: string,
    errorCode: string,
    attempts: number,
    availableAt: Date | null,
  ): Promise<"RETRY" | "DEAD_LETTER">;
  getStatus(
    actor: SessionActor,
    projectId: string,
  ): Promise<LiveModelStatus | null>;
  rebuild(
    actor: SessionActor,
    projectId: string,
    generatedAt: Date,
  ): Promise<{
    build: ProjectionBuildResult;
    persisted: PersistProjectionResult;
  }>;
  suppressWarning(
    actor: SessionActor,
    projectId: string,
    warningId: string,
    suppressed: boolean,
  ): Promise<void>;
}

export interface WorkerDependencies {
  repository: LiveModelRepository;
  logger: Logger;
  metrics: MetricsSink;
  now(): Date;
}
