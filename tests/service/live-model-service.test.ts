import { describe, expect, it, vi } from "vitest";
import { LiveModelService, LiveModelWorker, retryDelayMilliseconds } from "@/domains/live-model/application/service";
import type { ClaimedOutboxEvent, LiveModelRepository, ProjectionBuildResult } from "@/domains/live-model/application/ports";
import { projectionCandidate } from "@/domains/live-model/domain/projections";
import type { Logger } from "@/lib/observability/logger";
import { InMemoryMetricsSink } from "@/lib/observability/metrics";

const now = new Date("2026-08-30T00:00:00.000Z");
const actor = { userId: "user", workspaceId: "workspace", sessionId: "session", role: "OWNER" as const };

function logger(): Logger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() };
}

function stored(overrides: Partial<ClaimedOutboxEvent> = {}): ClaimedOutboxEvent {
  return { id: "event", workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: "project", eventType: "ProjectCreated", schemaVersion: 1, payload: { projectId: "project", structuralVersion: 4 }, attempts: 1, leaseOwner: "worker", leasedUntil: new Date(now.getTime() + 30_000), createdAt: now, ...overrides };
}

function build(): ProjectionBuildResult {
  return { projectId: "project", projectStructuralVersion: 4, projections: [projectionCandidate({ kind: "SEARCH_DOCUMENT", scopeType: "PROJECT", scopeId: "project", projectStructuralVersion: 4, sourceObjectVersions: { project: 4 }, payload: { synchronizationRequired: true }, freshness: "UPDATING", generatedAt: now })], warnings: [], searchActors: [actor], automationCount: 13, sourceCounts: { chapters: 1 } };
}

function repository(overrides: Partial<LiveModelRepository> = {}): LiveModelRepository {
  return {
    claim: vi.fn().mockResolvedValue([stored()]),
    deliveryExists: vi.fn().mockResolvedValue(false),
    build: vi.fn().mockResolvedValue(build()),
    persist: vi.fn().mockResolvedValue({ inserted: 1, updated: 0, staleRejected: 0, removed: 0, warningsActive: 0, digest: "a".repeat(64) }),
    synchronizeSearch: vi.fn().mockResolvedValue({ changed: 1, removed: 0, sourceCount: 7 }),
    completeDuplicate: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue("RETRY"),
    getStatus: vi.fn().mockResolvedValue(null),
    rebuild: vi.fn().mockResolvedValue({ build: build(), persisted: { inserted: 0, updated: 1, staleRejected: 0, removed: 0, warningsActive: 0, digest: "b".repeat(64) } }),
    suppressWarning: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("Live Story Model worker and service", () => {
  it("claims with frozen bounds, synchronizes SearchDocument, persists once, and emits content-safe evidence", async () => {
    const repo = repository(); const log = logger(); const metrics = new InMemoryMetricsSink();
    const result = await new LiveModelWorker({ repository: repo, logger: log, metrics, now: () => now }).runBatch("worker");
    expect(result).toEqual({ claimed: 1, completed: 1, duplicates: 0, retried: 0, deadLettered: 0 });
    expect(repo.claim).toHaveBeenCalledWith("worker", 50, 30_000);
    expect(repo.synchronizeSearch).toHaveBeenCalledBefore(vi.mocked(repo.persist));
    expect(vi.mocked(repo.persist).mock.calls[0]?.[1].projections[0]).toMatchObject({ freshness: "FRESH", payload: { indexedDocumentCount: 7, synchronizationRequired: false } });
    expect(metrics.points.map((point) => point.name)).toEqual(expect.arrayContaining(["live_model.worker.batch.duration", "live_model.worker.event.completed", "live_model.worker.event.failed"]));
    const evidence = JSON.stringify([...vi.mocked(log.info).mock.calls, ...vi.mocked(log.warn).mock.calls]);
    expect(evidence).toContain("S12-DIRECTIVE-001"); expect(evidence).toContain("S12-COORDINATE-001"); expect(evidence).toContain("S12-AUTOMATION-001"); expect(evidence).toContain("S12-WARNING-002");
    expect(evidence).not.toMatch(/private prose|capture body|manuscript text/iu);
  });

  it("completes an already-delivered row without rebuilding or persisting", async () => {
    const repo = repository({ deliveryExists: vi.fn().mockResolvedValue(true) });
    const result = await new LiveModelWorker({ repository: repo, logger: logger(), metrics: new InMemoryMetricsSink(), now: () => now }).runBatch("worker");
    expect(result.duplicates).toBe(1); expect(repo.completeDuplicate).toHaveBeenCalledWith("event", "worker"); expect(repo.build).not.toHaveBeenCalled(); expect(repo.persist).not.toHaveBeenCalled();
  });

  it("uses bounded exponential retry and dead-letters at the eighth attempt", async () => {
    expect([1, 2, 3, 9, 20].map(retryDelayMilliseconds)).toEqual([1_000, 2_000, 4_000, 256_000, 300_000]);
    const retryRepo = repository({ build: vi.fn().mockRejectedValue(new Error("EVENT_SCHEMA_UNSUPPORTED")) });
    const retry = await new LiveModelWorker({ repository: retryRepo, logger: logger(), metrics: new InMemoryMetricsSink(), now: () => now }).runBatch("worker");
    expect(retry.retried).toBe(1); expect(retryRepo.fail).toHaveBeenCalledWith("event", "worker", "EVENT_SCHEMA_UNSUPPORTED", 1, new Date(now.getTime() + 1_000));
    const deadRepo = repository({ claim: vi.fn().mockResolvedValue([stored({ attempts: 8 })]), build: vi.fn().mockRejectedValue(new Error("unsafe runtime details")), fail: vi.fn().mockResolvedValue("DEAD_LETTER") });
    const dead = await new LiveModelWorker({ repository: deadRepo, logger: logger(), metrics: new InMemoryMetricsSink(), now: () => now }).runBatch("worker");
    expect(dead.deadLettered).toBe(1); expect(deadRepo.fail).toHaveBeenCalledWith("event", "worker", "RETRYABLE", 8, null);
  });

  it("keeps ownership outcomes and the unsuppressible integrity rule in the application contract", async () => {
    const repo = repository({ getStatus: vi.fn().mockResolvedValue(null) }); const log = logger(); const service = new LiveModelService(repo, log, new InMemoryMetricsSink());
    await expect(service.status(actor, "other-project", "request")).resolves.toBeNull();
    expect(() => service.ensureSuppressible("HARD_PREREQUISITE_LOOP")).toThrow(/cannot be suppressed/iu);
    await service.suppress(actor, "project", "warning", true, "request"); expect(repo.suppressWarning).toHaveBeenCalledWith(actor, "project", "warning", true);
    const rebuilt = await service.rebuild(actor, "project", "request"); expect(rebuilt).toMatchObject({ projectStructuralVersion: 4, projectionCount: 1, updated: 1 });
  });
});
