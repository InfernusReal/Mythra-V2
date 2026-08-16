import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ContextRepository, ContextSnapshot } from "@/domains/context/application/ports";
import { ContextService } from "@/domains/context/application/service";
import type { Logger } from "@/lib/observability/logger";

const id = (value: number) => `40000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const actor: SessionActor = { userId: id(1), workspaceId: id(2), role: "OWNER", sessionId: id(3) };
const snapshot: ContextSnapshot = { projectId: id(4), projectStructuralVersion: 4, chapterId: id(5), chapterVersion: 2, outline: null, extraOutlines: [], milestones: [], references: [], causal: [], intents: [], pins: [], preferences: { mutedTypes: [], directiveEnabled: true } };

function setup() {
  const repository: ContextRepository = { load: vi.fn().mockResolvedValue(snapshot), mutatePreference: vi.fn().mockResolvedValue({ mutedTypes: ["MILESTONE"], directiveEnabled: true, pinCount: 1 }), editSource: vi.fn().mockResolvedValue({ sourceId: id(6), sourceVersion: 2, projectStructuralVersion: 5 }) };
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() } as unknown as Logger;
  return { service: new ContextService(repository, logger), repository, logger };
}

describe("ContextService", () => {
  it("parses and resolves a bounded read through the active registry", async () => {
    const { service, repository, logger } = setup(); const result = await service.get(actor, snapshot.chapterId, { selectedIds: [], cardCap: "8" }, id(7)); expect(result?.page).toMatchObject({ cardCap: 8, returnedCards: 0 }); expect(repository.load).toHaveBeenCalled(); expect(logger.info).toHaveBeenCalledWith("context.resolved", expect.objectContaining({ step: "S7-CONTEXT-001", returnedCards: 0 }));
  });
  it("rejects a later-gate card type before persistence", async () => { const { service, repository } = setup(); await expect(service.mutatePreference(actor, snapshot.projectId, { action: "PIN", cardType: "TIMELINE_EVENT", sourceId: id(6) }, id(7))).rejects.toThrow(); expect(repository.mutatePreference).not.toHaveBeenCalled(); });
  it("allows only versioned, author-approved safe source fields", async () => { const { service, repository } = setup(); await service.editSource(actor, snapshot.projectId, { sourceType: "CHAPTER_OUTLINE", sourceId: id(6), expectedVersion: 1, expectedStructuralVersion: 4, field: "purpose", value: "Private purpose" }, id(7)); expect(repository.editSource).toHaveBeenCalledWith(actor, snapshot.projectId, expect.objectContaining({ field: "purpose", expectedVersion: 1 })); });
  it("reports the S7 providers plus the canonical S8 Capture provider", () => { expect(setup().service.activeProviderIds()).toEqual(["chapter-outline", "milestone", "direct-causal", "existing-reference", "narrative-intent", "capture"]); });
});
