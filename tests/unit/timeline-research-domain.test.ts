import { describe, expect, it } from "vitest";
import { normalizeNoteTags } from "@/domains/notes/domain/types";
import { allowedResearchMimeTypes, MAX_RESEARCH_FILE_BYTES, researchCreateSchema, validateResearchFile } from "@/domains/research/domain/types";
import { HmacAssetAccessTokenService } from "@/domains/research/infrastructure/signed-asset-access";
import { comparableCoordinate, timelineEventWriteSchema, timelineLinkSchema, timelineListSchema, timelineModes } from "@/domains/timeline/domain/types";
import { cacheChapterSearch, cacheContextModel, degradedCapabilityMatrix, readCachedChapterSearch, readStaleContextModel } from "@/lib/offline/degraded-mode";
import type { SearchReadModel } from "@/domains/search/domain/types";
import type { ContextFieldReadModel } from "@/domains/context/domain/types";

const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = { userId: id(1), workspaceId: id(2), sessionId: id(3), role: "OWNER" as const };

describe("Timeline, Notes, Research and degraded-mode contracts", () => {
  it("validates every timeline mode without Gregorian assumptions and rejects incompatible coordinates", () => {
    const cases = [
      { mode: "ABSOLUTE", title: "A", displayLabel: "Year of Ash", sortStart: 10 },
      { mode: "APPROXIMATE", title: "B", displayLabel: "Around the thaw", sortStart: -2 },
      { mode: "RELATIVE", title: "C", displayLabel: "Three beats later", relativeToEventId: id(8), relativeOffset: 3 },
      { mode: "ORDINAL", title: "D", displayLabel: "First remembered", ordinalValue: 1 },
      { mode: "RANGE", title: "E", displayLabel: "Long siege", sortStart: 20, sortEnd: 30 }
    ];
    expect(cases.map((value) => timelineEventWriteSchema.parse(value).mode)).toEqual(timelineModes);
    expect(timelineEventWriteSchema.safeParse({ ...cases[4], sortEnd: 19 }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ ...cases[0], ordinalValue: 1 }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "ABSOLUTE", title: "A", displayLabel: "A" }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "RELATIVE", title: "R", displayLabel: "R", relativeToEventId: id(8) }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "ORDINAL", title: "O", displayLabel: "O" }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "RANGE", title: "R", displayLabel: "R", sortStart: 1 }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "APPROXIMATE", title: "A", displayLabel: "A", sortStart: 1, sortEnd: 2 }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ mode: "ABSOLUTE", title: "A", displayLabel: "A", sortStart: 1, relativeToEventId: id(8), relativeOffset: 1 }).success).toBe(false);
    expect(timelineEventWriteSchema.safeParse({ eventId: id(8), mode: "RELATIVE", title: "R", displayLabel: "R", relativeToEventId: id(8), relativeOffset: 1 }).success).toBe(false);
    expect(timelineLinkSchema.safeParse({ eventId: id(8), targetType: "TIMELINE_EVENT", targetId: id(8) }).success).toBe(false);
    expect(timelineLinkSchema.safeParse({ eventId: id(8), targetType: "CHAPTER", targetId: id(9) }).success).toBe(true);
    expect(timelineListSchema.parse({}).limit).toBe(50); expect(timelineListSchema.parse({ mode: "RANGE", limit: "100" }).limit).toBe(100);
    expect(comparableCoordinate({ mode: "RANGE", sortStart: 20, ordinalValue: null })).toBe(20);
    expect(comparableCoordinate({ mode: "ORDINAL", sortStart: null, ordinalValue: 3 })).toBe(3);
    expect(comparableCoordinate({ mode: "APPROXIMATE", sortStart: -2, ordinalValue: null })).toBe(-2);
    expect(comparableCoordinate({ mode: "RELATIVE", sortStart: null, ordinalValue: null })).toBeNull();
  });

  it("normalizes bounded tags and enforces all research variant and file boundaries", () => {
    expect(normalizeNoteTags([" Lore ", "lore", "ÉLAN", "e\u0301lan"])).toEqual(["lore", "élan"]);
    expect(researchCreateSchema.parse({ kind: "URL", title: "Source", url: "https://example.test/source" }).kind).toBe("URL");
    expect(researchCreateSchema.parse({ kind: "NOTE", title: "Note", body: "body" }).kind).toBe("NOTE");
    expect(researchCreateSchema.parse({ kind: "EXCERPT", title: "Excerpt", excerpt: "text", citation: "source" }).kind).toBe("EXCERPT");
    expect(researchCreateSchema.parse({ kind: "CITATION", title: "Citation", citation: "source", body: "comment" }).kind).toBe("CITATION");
    expect(researchCreateSchema.parse({ kind: "FILE", title: "File", assetId: id(8) }).kind).toBe("FILE");
    expect(researchCreateSchema.safeParse({ kind: "FILE", title: "Unsafe" }).success).toBe(false);
    for (const contentType of allowedResearchMimeTypes) expect(validateResearchFile({ displayName: "safe/name", contentType, sizeBytes: 1 }).displayName).toBe("safe_name");
    expect(() => validateResearchFile({ displayName: "x.pdf", contentType: "application/pdf", sizeBytes: MAX_RESEARCH_FILE_BYTES + 1 })).toThrow(/10 MiB/u);
    expect(() => validateResearchFile({ displayName: "x.svg", contentType: "image/svg+xml", sizeBytes: 10 })).toThrow(/not supported/u);
    expect(() => validateResearchFile({ displayName: "   ", contentType: "text/plain", sizeBytes: 10 })).toThrow(/valid file name/u);
    expect(() => validateResearchFile({ displayName: "x.txt", contentType: "text/plain", sizeBytes: 0 })).toThrow(/10 MiB/u);
  });

  it("issues actor/project-bound expiring private tokens", () => {
    const tokens = new HmacAssetAccessTokenService("s".repeat(64), 1_000);
    const token = tokens.issue(actor, id(4), id(5), 100);
    expect(() => tokens.verify(token, actor, id(4), id(5), 1_099)).not.toThrow();
    expect(() => tokens.verify(token, actor, id(4), id(5), 1_100)).toThrow(/not permitted/u);
    expect(() => tokens.verify(token, { ...actor, userId: id(9) }, id(4), id(5), 200)).toThrow(/not permitted/u);
    expect(() => tokens.verify(`${token}x`, actor, id(4), id(5), 200)).toThrow(/not permitted/u);
    expect(() => tokens.verify("malformed", actor, id(4), id(5), 200)).toThrow(/not permitted/u);
    expect(() => tokens.verify(token, { ...actor, workspaceId: id(99) }, id(4), id(5), 200)).toThrow(/not permitted/u);
    expect(() => tokens.verify(token, actor, id(99), id(5), 200)).toThrow(/not permitted/u);
    expect(() => tokens.verify(token, actor, id(4), id(99), 200)).toThrow(/not permitted/u);
  });

  it("keeps offline Search chapter-only and marks every cached context projection stale", () => {
    const store = new Map<string, string>(); const storage = { setItem: (key: string, value: string) => store.set(key, value), getItem: (key: string) => store.get(key) ?? null };
    const result = (type: "CHAPTER" | "NOTE", n: number) => ({ id: id(n), documentType: type, sourceId: id(n + 10), sourceKey: `${type}:${id(n + 10)}`, blockId: null, title: type === "CHAPTER" ? "Harbor" : "Private note", snippet: "storm harbor", sourceVersion: 1, sourceUpdatedAt: new Date().toISOString(), indexedAt: new Date().toISOString(), freshness: "CURRENT" as const, rank: 1, matchReasons: [], explicitReference: false, currentContext: false, actions: [], metadata: {} });
    const search: SearchReadModel = { projectId: id(4), projectStructuralVersion: 2, groups: [{ type: "CHAPTER", label: "Chapters", total: 1, results: [result("CHAPTER", 20)], hasMore: false }, { type: "NOTE", label: "Notes", total: 1, results: [result("NOTE", 30)], hasMore: false }], providerStates: [], page: { returned: 2, limit: 60, nextCursor: null, total: 2 }, synchronized: { insertedOrUpdated: 2, removed: 0, sourceCount: 2, capped: false } };
    cacheChapterSearch(id(4), search, storage); const offline = readCachedChapterSearch(id(4), "harbor", storage);
    expect(offline?.groups.flatMap((group) => group.results).map((item) => item.documentType)).toEqual(["CHAPTER"]);
    expect(degradedCapabilityMatrix.structureMutations).toBe("UNAVAILABLE"); expect(degradedCapabilityMatrix.capture).toBe("AVAILABLE_QUEUED");
    const context = { chapterId: id(7), descriptors: [{ stale: false }], directive: { stale: false } } as unknown as ContextFieldReadModel;
    cacheContextModel(context, storage); const stale = readStaleContextModel(id(7), storage);
    expect(stale?.descriptors.every((item) => item.stale)).toBe(true); expect(stale?.directive.stale).toBe(true);
    expect(readCachedChapterSearch(id(99), "harbor", storage)).toBeNull(); expect(readCachedChapterSearch(id(4), "absent", storage)?.groups).toEqual([]);
    expect(readStaleContextModel(id(99), storage)).toBeNull();
    const badStorage = { getItem: () => "{" }; expect(readCachedChapterSearch(id(4), "x", badStorage)).toBeNull(); expect(readStaleContextModel(id(7), badStorage)).toBeNull();
    const invalidStorage = { getItem: () => JSON.stringify({ projectId: id(4), chapters: "invalid" }) }; expect(readCachedChapterSearch(id(4), "x", invalidStorage)).toBeNull();
    const invalidContext = { getItem: () => JSON.stringify({ chapterId: id(7), descriptors: "invalid" }) }; expect(readStaleContextModel(id(7), invalidContext)).toBeNull();
  });
});
