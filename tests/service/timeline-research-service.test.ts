import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@/lib/observability/logger";
import type { PrivateObjectStorage } from "@/lib/storage/object-storage";
import { TimelineService } from "@/domains/timeline/application/service";
import type { TimelineRepository } from "@/domains/timeline/application/ports";
import { NoteService } from "@/domains/notes/application/service";
import type { NoteRepository } from "@/domains/notes/application/ports";
import { ResearchService } from "@/domains/research/application/service";
import type { MalwareScanner, ResearchRepository } from "@/domains/research/application/ports";
import { HmacAssetAccessTokenService } from "@/domains/research/infrastructure/signed-asset-access";

const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = { userId: id(1), workspaceId: id(2), sessionId: id(3), role: "OWNER" as const };
const logger = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() }) as unknown as Logger;
const timelineEvent = { id: id(5), title: "Authored", description: null, mode: "ORDINAL" as const, displayLabel: "First", calendarKey: null, sortStart: null, sortEnd: null, relativeToEventId: null, relativeOffset: null, ordinalValue: 1, version: 1, updatedAt: new Date().toISOString(), links: [] };
const note = { id: id(6), title: "Private", body: "private body", tags: ["lore"], sourceCaptureId: null, version: 1, updatedAt: new Date().toISOString(), backlinkCount: 0 };
const research = { id: id(7), kind: "NOTE" as const, title: "Private", body: "private body", url: null, citation: null, excerpt: null, asset: null, version: 1, updatedAt: new Date().toISOString() };

describe("Timeline, Note and Research services", () => {
  it("delegates bounded timeline writes/links and redacts authored labels from logs", async () => {
    const repository = { list: vi.fn().mockResolvedValue({ events: [timelineEvent], nextCursor: null, projectStructuralVersion: 4 }), write: vi.fn().mockResolvedValue({ event: timelineEvent, projectStructuralVersion: 5, invalidationKeys: ["causal:timeline"] }), link: vi.fn().mockResolvedValue({ linkId: id(8), replayed: false }) } satisfies TimelineRepository;
    const log = logger(); const service = new TimelineService(repository, log);
    await service.list(actor, id(4), { limit: 100 }, id(9)); await service.write(actor, id(4), { title: "Secret event", mode: "ORDINAL", displayLabel: "Secret label", ordinalValue: 1 }, id(9)); await service.link(actor, id(4), { eventId: id(5), targetType: "CHAPTER", targetId: id(10) }, id(9));
    expect(repository.write).toHaveBeenCalled(); expect(repository.link).toHaveBeenCalled(); const logs = JSON.stringify(vi.mocked(log.info).mock.calls); expect(logs).not.toContain("Secret event"); expect(logs).not.toContain("Secret label");
  });

  it("normalizes Note service inputs and preserves promotion identity without content logging", async () => {
    const repository = { list: vi.fn().mockResolvedValue({ notes: [note], nextCursor: null, projectStructuralVersion: 4 }), write: vi.fn().mockResolvedValue({ note, projectStructuralVersion: 4 }), promote: vi.fn().mockResolvedValue({ promotionId: id(8), targetType: "STORY_CHANGE", targetId: id(9), projectStructuralVersion: 5, replayed: false }) } satisfies NoteRepository;
    const log = logger(); const service = new NoteService(repository, log);
    await service.list(actor, id(4), { tag: "lore", limit: 10 }, id(10)); await service.write(actor, id(4), { title: "Private", body: "secret body", tags: [" Lore ", "lore"] }, id(10)); await service.promote(actor, id(4), { noteId: id(6), targetType: "STORY_CHANGE", idempotencyKey: "stable", expectedStructuralVersion: 4 }, id(10));
    expect(repository.write).toHaveBeenCalledWith(actor, id(4), expect.objectContaining({ tags: ["Lore", "lore"] })); expect(JSON.stringify(vi.mocked(log.info).mock.calls)).not.toContain("secret body");
  });

  it("scans before activation and requires a signed actor-bound download token", async () => {
    const repository = { list: vi.fn().mockResolvedValue({ items: [research], nextCursor: null }), create: vi.fn().mockResolvedValue({ item: research }), link: vi.fn().mockResolvedValue({ linkId: id(8), replayed: false }), reserveAsset: vi.fn().mockResolvedValue({ assetId: id(11), replayed: false }), completeAsset: vi.fn().mockResolvedValue(undefined), authorizeAsset: vi.fn().mockResolvedValue({ storageKey: "private-key", contentType: "text/plain", displayName: "safe.txt", sizeBytes: 4 }) } satisfies ResearchRepository;
    const storage = { putPrivate: vi.fn().mockResolvedValue(undefined), createSignedDownloadUrl: vi.fn(), getPrivate: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])), deletePrivate: vi.fn().mockResolvedValue(undefined) } satisfies PrivateObjectStorage;
    const scanner = { scan: vi.fn().mockResolvedValue({ status: "CLEAN", reasonCode: "CLEAN" }) } satisfies MalwareScanner;
    const tokens = new HmacAssetAccessTokenService("s".repeat(64)); const log = logger(); const service = new ResearchService(repository, storage, scanner, tokens, log);
    await service.list(actor, id(4), { kind: "NOTE", limit: 10 }, id(12)); await service.create(actor, id(4), { kind: "NOTE", title: "Private", body: "private body" }, id(12)); await service.link(actor, id(4), { researchItemId: id(7), targetType: "CHAPTER", targetId: id(9) }, id(12));
    await service.upload(actor, id(4), { name: "private.txt", type: "text/plain", bytes: new Uint8Array([1, 2, 3, 4]) }, id(12));
    expect(storage.putPrivate).toHaveBeenCalledBefore(scanner.scan); expect(scanner.scan).toHaveBeenCalledBefore(repository.completeAsset);
    const access = await service.issueAssetAccess(actor, id(4), id(11), id(12)); const token = new URL(`https://mythra.test${access.href}`).searchParams.get("access")!;
    expect((await service.download(actor, id(4), id(11), token, id(12))).bytes).toHaveLength(4);
    await expect(service.download({ ...actor, userId: id(99) }, id(4), id(11), token, id(12))).rejects.toMatchObject({ code: "FORBIDDEN" });
    const logs = JSON.stringify(vi.mocked(log.info).mock.calls); expect(logs).not.toContain("private.txt"); expect(logs).not.toContain("private-key"); expect(logs).not.toContain(token);
  });

  it("deletes rejected bytes and never exposes the rejected asset", async () => {
    const repository = { list: vi.fn(), create: vi.fn(), link: vi.fn(), reserveAsset: vi.fn().mockResolvedValue({ assetId: id(11), replayed: false }), completeAsset: vi.fn().mockResolvedValue(undefined), authorizeAsset: vi.fn() } as unknown as ResearchRepository;
    const storage = { putPrivate: vi.fn().mockResolvedValue(undefined), createSignedDownloadUrl: vi.fn(), getPrivate: vi.fn(), deletePrivate: vi.fn().mockResolvedValue(undefined) } satisfies PrivateObjectStorage;
    const scanner = { scan: vi.fn().mockResolvedValue({ status: "INFECTED", reasonCode: "SIGNATURE_MATCH" }) } satisfies MalwareScanner;
    const service = new ResearchService(repository, storage, scanner, new HmacAssetAccessTokenService("s".repeat(64)), logger());
    await service.upload(actor, id(4), { name: "bad.txt", type: "text/plain", bytes: new Uint8Array([1]) }, id(12)); expect(storage.deletePrivate).toHaveBeenCalledWith(expect.any(String));
  });

  it("handles upload replay, scanner failure, and invalid-file branches without activating unsafe bytes", async () => {
    const replayRepository = { reserveAsset: vi.fn().mockResolvedValue({ assetId: id(11), replayed: true }) } as unknown as ResearchRepository;
    const replayStorage = { putPrivate: vi.fn(), createSignedDownloadUrl: vi.fn(), getPrivate: vi.fn(), deletePrivate: vi.fn() } satisfies PrivateObjectStorage;
    const replayScanner = { scan: vi.fn() } satisfies MalwareScanner; const replay = new ResearchService(replayRepository, replayStorage, replayScanner, new HmacAssetAccessTokenService("s".repeat(64)), logger());
    await replay.upload(actor, id(4), { name: "same.txt", type: "text/plain", bytes: new Uint8Array([1]) }, id(12)); expect(replayStorage.putPrivate).not.toHaveBeenCalled(); expect(replayScanner.scan).not.toHaveBeenCalled();

    const failureRepository = { reserveAsset: vi.fn().mockResolvedValue({ assetId: id(11), replayed: false }), completeAsset: vi.fn().mockResolvedValue(undefined) } as unknown as ResearchRepository;
    const failureStorage = { putPrivate: vi.fn().mockResolvedValue(undefined), createSignedDownloadUrl: vi.fn(), getPrivate: vi.fn(), deletePrivate: vi.fn().mockResolvedValue(undefined) } satisfies PrivateObjectStorage;
    const failureScanner = { scan: vi.fn().mockRejectedValue(new Error("scanner down")) } satisfies MalwareScanner; const failure = new ResearchService(failureRepository, failureStorage, failureScanner, new HmacAssetAccessTokenService("s".repeat(64)), logger());
    await failure.upload(actor, id(4), { name: "safe.txt", type: "text/plain", bytes: new Uint8Array([1]) }, id(12)); expect(failureRepository.completeAsset).toHaveBeenCalledWith(actor, id(4), id(11), { status: "ERROR", reasonCode: "SCANNER_UNAVAILABLE" }); expect(failureStorage.deletePrivate).toHaveBeenCalled();
    await expect(failure.upload(actor, id(4), { name: "unsafe.svg", type: "image/svg+xml", bytes: new Uint8Array([1]) }, id(12))).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
