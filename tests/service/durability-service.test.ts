import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { DurabilityService } from "@/domains/writing/application/durability";
import type { DurabilityRepository } from "@/domains/writing/application/durability-ports";
import { emptyChapterDocument } from "@/domains/writing/domain/chapter-document";
import { createLogger } from "@/lib/observability/logger";
import { InMemoryOperationalEventSink } from "@/lib/observability/operations";

const actor: SessionActor = { userId: "eb0580e5-63dd-42f8-8b31-3126d5486395", workspaceId: "a7ccfcaa-217c-4381-b51e-f50ade701066", role: "OWNER", sessionId: "88f99868-c607-4c0e-bb76-2635e8650846" };
const chapterId = "399dc9ee-fda5-434a-95b5-36f60f166e86";
const clientSaveId = "4f269c68-6c40-4e3c-a754-deec54fa1ae2";
const document = emptyChapterDocument();

function repository(): DurabilityRepository {
  return {
    saveDraft: vi.fn().mockResolvedValue({ status: "SAVED", chapterId, version: 2, clientSaveId, idempotentReplay: false, wordCount: 0 }),
    checkpoint: vi.fn().mockResolvedValue({ revisionId: "d98ad21f-04bc-4433-8aed-4efad8813fb8", version: 2, idempotentReplay: false }),
    getConflict: vi.fn().mockResolvedValue(null),
    resolveConflict: vi.fn().mockResolvedValue({ status: "RESOLVED", resolution: "KEEP_SERVER", chapterId, version: 2, document })
  };
}

describe("DurabilityService", () => {
  it("validates version/save identity/document and excludes content from logs", async () => {
    document.content[0]!.content = [{ type: "text", text: "Private service prose" }];
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const repo = repository();
    const service = new DurabilityService(repo, createLogger({ module: "durability" }));
    await service.save(actor, chapterId, { baseVersion: 1, clientSaveId, document }, "request-s2");
    expect(repo.saveDraft).toHaveBeenCalledWith(actor, chapterId, { baseVersion: 1, clientSaveId, document });
    expect(String(consoleSpy.mock.calls[0]?.[0])).not.toContain("Private service prose");
    await expect(service.save(actor, chapterId, { baseVersion: 0, clientSaveId, document }, "invalid")).rejects.toThrow();
  });

  it("accepts only the three explicit conflict outcomes", async () => {
    const service = new DurabilityService(repository(), createLogger());
    for (const resolution of ["KEEP_LOCAL", "KEEP_SERVER", "DUPLICATE_RECOVERY"] as const) {
      await expect(service.resolveConflict(actor, clientSaveId, { resolution }, "request")).resolves.toBeDefined();
    }
    await expect(service.resolveConflict(actor, clientSaveId, { resolution: "MERGE_SILENTLY" }, "request")).rejects.toThrow();
  });

  it("labels the deterministic canary cohort in content-safe save telemetry", async () => {
    const repo = repository();
    vi.mocked(repo.saveDraft).mockResolvedValue({ status: "SAVED", chapterId, projectId: "4ab218e3-a86f-4f41-a11a-ec29971578aa", version: 2, clientSaveId, idempotentReplay: false, wordCount: 0 });
    const operations = new InMemoryOperationalEventSink();
    const service = new DurabilityService(repo, createLogger(), undefined, operations, (workspaceId) => workspaceId === actor.workspaceId);
    await service.save(actor, chapterId, { baseVersion: 1, clientSaveId, document }, "canary-request");
    expect(operations.events).toMatchObject([{ workspaceId: actor.workspaceId, projectId: "4ab218e3-a86f-4f41-a11a-ec29971578aa", eventName: "writing.save", dimensions: { outcome: "success", featureFlag: "editor_save_canary" } }]);
  });

  it("emits a content-free failure signal and preserves the rejected save error", async () => {
    const repo = repository();
    const rejection = new Error("PRIVATE_DATABASE_FAILURE_DETAIL");
    vi.mocked(repo.saveDraft).mockRejectedValue(rejection);
    const operations = new InMemoryOperationalEventSink();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new DurabilityService(repo, createLogger(), undefined, operations);
    await expect(service.save(actor, chapterId, { baseVersion: 1, clientSaveId, document }, "failure-request")).rejects.toBe(rejection);
    expect(operations.events).toMatchObject([{ workspaceId: actor.workspaceId, eventName: "writing.save", dimensions: { outcome: "failure" } }]);
    expect(JSON.stringify(operations.events)).not.toContain("PRIVATE_DATABASE_FAILURE_DETAIL");
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain("PRIVATE_DATABASE_FAILURE_DETAIL");
  });

  it("does not classify rejected client input as a durable-save failure", async () => {
    const repo = repository();
    const operations = new InMemoryOperationalEventSink();
    const service = new DurabilityService(repo, createLogger(), undefined, operations);
    await expect(service.save(actor, chapterId, { baseVersion: 0, clientSaveId, document }, "invalid-request")).rejects.toThrow();
    expect(repo.saveDraft).not.toHaveBeenCalled();
    expect(operations.events).toEqual([]);
  });
});
