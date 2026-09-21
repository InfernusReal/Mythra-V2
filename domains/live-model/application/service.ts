import { createHash } from "node:crypto";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { Logger } from "@/lib/observability/logger";
import type { MetricsSink } from "@/lib/observability/metrics";
import { finishTrace, startTrace } from "@/lib/observability/trace";
import { normalizeDomainEvent } from "../domain/events";
import { projectionCandidate } from "../domain/projections";
import { isWarningSuppressible } from "../domain/warnings";
import type { LiveModelRepository, WorkerDependencies } from "./ports";

const BATCH_SIZE = 50;
const LEASE_MILLISECONDS = 30_000;
const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_MILLISECONDS = 5 * 60_000;

function safeErrorCode(error: unknown): string {
  if (error instanceof Error && /^[A-Z][A-Z0-9_]{2,79}$/u.test(error.message)) return error.message;
  return "RETRYABLE";
}

export function retryDelayMilliseconds(attempts: number): number {
  return Math.min(MAX_BACKOFF_MILLISECONDS, 1_000 * 2 ** Math.max(0, attempts - 1));
}

export class LiveModelWorker {
  constructor(private readonly dependencies: WorkerDependencies) {}

  async runBatch(workerId: string): Promise<{ claimed: number; completed: number; duplicates: number; retried: number; deadLettered: number }> {
    const trace = startTrace("live-model.worker.batch");
    // Console trace S12-WORKER-001: outbox claim begins with worker identity and fixed content-safe bounds.
    this.dependencies.logger.info("live_model.worker_claim_started", { step: "S12-WORKER-001", workerId, batchSize: BATCH_SIZE, leaseMilliseconds: LEASE_MILLISECONDS });
    const events = await this.dependencies.repository.claim(workerId, BATCH_SIZE, LEASE_MILLISECONDS);
    // Console trace S12-WORKER-002: claimed event count is recorded without event payloads.
    this.dependencies.logger.info("live_model.worker_claim_completed", { step: "S12-WORKER-002", workerId, claimed: events.length });
    const result = { claimed: events.length, completed: 0, duplicates: 0, retried: 0, deadLettered: 0 };
    for (const stored of events) {
      try {
        if (await this.dependencies.repository.deliveryExists(stored.id)) {
          await this.dependencies.repository.completeDuplicate(stored.id, workerId);
          result.duplicates += 1;
          // Console trace S12-WORKER-003: duplicate delivery is completed idempotently using identifiers only.
          this.dependencies.logger.info("live_model.worker_duplicate_completed", { step: "S12-WORKER-003", workerId, eventId: stored.id, attempts: stored.attempts });
          continue;
        }
        const event = normalizeDomainEvent(stored);
        // Console trace S12-WORKER-004: normalized catalog identity and versions are recorded without payload content.
        this.dependencies.logger.info("live_model.event_normalized", { step: "S12-WORKER-004", workerId, eventId: event.id, projectId: event.projectId, eventType: event.type, originalEventType: event.originalType, eventSchemaVersion: event.schemaVersion, structuralVersion: event.structuralVersion ?? 0 });
        const generatedAt = this.dependencies.now();
        // Console trace S12-PROJECTION-001: canonical projection build starts for one project and event.
        this.dependencies.logger.info("live_model.projection_build_started", { step: "S12-PROJECTION-001", workerId, eventId: event.id, projectId: event.projectId });
        const build = await this.dependencies.repository.build(event, generatedAt);
        // Console trace S12-PROJECTION-002: bounded projection and warning counts prove deterministic build completion.
        this.dependencies.logger.info("live_model.projection_build_completed", { step: "S12-PROJECTION-002", workerId, eventId: event.id, projectId: event.projectId, structuralVersion: build.projectStructuralVersion, projectionCount: build.projections.length, warningCount: build.warnings.length, automationCount: build.automationCount });
        // Console trace S12-DIRECTIVE-001: complete directive materialization is reported by count without narrative content.
        this.dependencies.logger.info("live_model.directive_materialized", { step: "S12-DIRECTIVE-001", workerId, eventId: event.id, projectId: event.projectId, directiveCount: build.projections.filter((candidate) => candidate.kind === "NARRATIVE_DIRECTIVE").length });
        // Console trace S12-COORDINATE-001: ruled semantic-coordinate materialization is reported by count only.
        this.dependencies.logger.info("live_model.semantic_coordinate_materialized", { step: "S12-COORDINATE-001", workerId, eventId: event.id, projectId: event.projectId, coordinateCount: build.projections.filter((candidate) => candidate.kind === "SEMANTIC_COORDINATE").length });
        // Console trace S12-AUTOMATION-001: the frozen deterministic automation catalog execution count is recorded.
        this.dependencies.logger.info("live_model.automations_evaluated", { step: "S12-AUTOMATION-001", workerId, eventId: event.id, projectId: event.projectId, automationCount: build.automationCount });
        // Console trace S12-WARNING-002: neutral warning evaluation reports only the active count.
        this.dependencies.logger.info("live_model.warnings_evaluated", { step: "S12-WARNING-002", workerId, eventId: event.id, projectId: event.projectId, warningCount: build.warnings.length });
        const search = await this.dependencies.repository.synchronizeSearch(build.searchActors, event.projectId);
        // Console trace S12-PROJECTION-003: SearchDocument propagation reports counts and version-safe scope only.
        this.dependencies.logger.info("live_model.search_synchronized", { step: "S12-PROJECTION-003", workerId, eventId: event.id, projectId: event.projectId, insertedOrUpdated: search.changed, removed: search.removed, sourceCount: search.sourceCount });
        const searchIndex = build.projections.findIndex((candidate) => candidate.kind === "SEARCH_DOCUMENT");
        if (searchIndex >= 0) {
          const marker = build.projections[searchIndex]!;
          build.projections[searchIndex] = projectionCandidate({ ...marker, payload: { ...marker.payload, indexedDocumentCount: search.sourceCount, synchronizationRequired: false }, freshness: "FRESH" });
        }
        const persisted = await this.dependencies.repository.persist(event, build, false);
        // Console trace S12-PROJECTION-004: projection commit reports stale rejection and repair-safe counts.
        this.dependencies.logger.info("live_model.projection_commit_completed", { step: "S12-PROJECTION-004", workerId, eventId: event.id, projectId: event.projectId, inserted: persisted.inserted, updated: persisted.updated, staleRejected: persisted.staleRejected, removed: persisted.removed, warningsActive: persisted.warningsActive });
        result.completed += 1;
        // Console trace S12-WORKER-005: event completion records the delivery digest but no derived or canonical content.
        this.dependencies.logger.info("live_model.worker_event_completed", { step: "S12-WORKER-005", workerId, eventId: event.id, projectId: event.projectId, structuralVersion: build.projectStructuralVersion, outputDigest: persisted.digest });
      } catch (error) {
        const errorCode = safeErrorCode(error);
        const retryAt = stored.attempts >= MAX_ATTEMPTS ? null : new Date(this.dependencies.now().getTime() + retryDelayMilliseconds(stored.attempts));
        const outcome = await this.dependencies.repository.fail(stored.id, workerId, errorCode, stored.attempts, retryAt);
        if (outcome === "RETRY") result.retried += 1; else result.deadLettered += 1;
        // Console trace S12-WORKER-006: retry/dead-letter outcome excludes raw runtime messages and payload data.
        this.dependencies.logger.warn("live_model.worker_event_failed", { step: "S12-WORKER-006", workerId, eventId: stored.id, attempts: stored.attempts, errorCode, outcome, retryDelayMilliseconds: retryAt ? retryAt.getTime() - this.dependencies.now().getTime() : 0 });
      }
    }
    const durationMs = finishTrace(trace).durationMs;
    this.dependencies.metrics.record({ name: "live_model.worker.batch.duration", value: durationMs, unit: "milliseconds", attributes: { workerId } });
    this.dependencies.metrics.record({ name: "live_model.worker.event.completed", value: result.completed, unit: "count", attributes: { workerId } });
    this.dependencies.metrics.record({ name: "live_model.worker.event.failed", value: result.retried + result.deadLettered, unit: "count", attributes: { workerId } });
    // Console trace S12-WORKER-007: batch completion exposes duration and outcome counters for lag/failure operations.
    this.dependencies.logger.info("live_model.worker_batch_completed", { step: "S12-WORKER-007", workerId, durationMilliseconds: Math.round(durationMs), claimed: result.claimed, completed: result.completed, duplicates: result.duplicates, retried: result.retried, deadLettered: result.deadLettered });
    return result;
  }
}

export class LiveModelService {
  constructor(private readonly repository: LiveModelRepository, private readonly logger: Logger, private readonly metrics: MetricsSink) {}

  async status(actor: SessionActor, projectId: string, requestId: string) {
    const model = await this.repository.getStatus(actor, projectId);
    if (!model) return null;
    // Console trace S12-API-001: status read logs freshness and queue counts without projection payloads.
    this.logger.info("live_model.status_read", { step: "S12-API-001", requestId, workspaceId: actor.workspaceId, projectId, structuralVersion: model.projectStructuralVersion, projectionCount: model.projectionCount, staleCount: model.staleCount, pendingEventCount: model.pendingEventCount, lagMilliseconds: model.lagMilliseconds });
    this.metrics.record({ name: "live_model.projection.lag", value: model.lagMilliseconds, unit: "milliseconds", attributes: { projectId } });
    return model;
  }

  async rebuild(actor: SessionActor, projectId: string, requestId: string) {
    // Console trace S12-REPAIR-001: ownership-scoped one-project repair begins without reading content into logs.
    this.logger.info("live_model.rebuild_started", { step: "S12-REPAIR-001", requestId, workspaceId: actor.workspaceId, projectId });
    const result = await this.repository.rebuild(actor, projectId, new Date());
    // Console trace S12-REPAIR-002: repair completion records deterministic counts, stale rejects, and output digest.
    this.logger.info("live_model.rebuild_completed", { step: "S12-REPAIR-002", requestId, workspaceId: actor.workspaceId, projectId, structuralVersion: result.build.projectStructuralVersion, projectionCount: result.build.projections.length, inserted: result.persisted.inserted, updated: result.persisted.updated, removed: result.persisted.removed, staleRejected: result.persisted.staleRejected, outputDigest: result.persisted.digest });
    return { projectStructuralVersion: result.build.projectStructuralVersion, projectionCount: result.build.projections.length, warningCount: result.build.warnings.length, ...result.persisted };
  }

  async suppress(actor: SessionActor, projectId: string, warningId: string, suppressed: boolean, requestId: string) {
    await this.repository.suppressWarning(actor, projectId, warningId, suppressed);
    // Console trace S12-WARNING-001: warning preference mutation records only stable identifiers and action.
    this.logger.info("live_model.warning_suppression_changed", { step: "S12-WARNING-001", requestId, workspaceId: actor.workspaceId, projectId, warningId, suppressed });
    return { warningId, suppressed };
  }

  ensureSuppressible(type: Parameters<typeof isWarningSuppressible>[0]): void {
    if (!isWarningSuppressible(type)) throw errors.validation("This data-integrity warning cannot be suppressed.");
  }
}

export function deterministicWorkerId(host: string, processId: number): string {
  return createHash("sha256").update(`${host}:${processId}`).digest("hex").slice(0, 32);
}
