import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { SearchProviderRegistry } from "@/domains/search/domain/provider-registry";
import { activeSearchDocumentTypes, normalizeSearchText, scoreSearchResult, searchOffset, searchQuerySchema } from "@/domains/search/domain/types";
import { PrismaSearchRepository } from "@/domains/search/infrastructure/prisma-search-repository";

describe("Search domain", () => {
  it("normalizes Unicode, validates bounded queries and decodes stable cursors", () => {
    expect(normalizeSearchText("  Élan—ARC  ")).toBe("elan arc");
    expect(searchQuerySchema.parse({ query: " hero ", limit: "100", cursor: "offset:40" })).toMatchObject({ query: "hero", limit: 100 });
    expect(searchQuerySchema.safeParse({ query: "", limit: 40 }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ query: "x".repeat(161), limit: 40 }).success).toBe(false);
    expect(searchOffset()).toBe(0); expect(searchOffset("offset:41")).toBe(41);
  });
  it("ranks exact, prefix, phrase, tokens, fuzzy, reference, context and recency deterministically", () => {
    const now = new Date("2026-08-17T00:00:00.000Z");
    const exact = scoreSearchResult({ normalizedQuery: "hero", normalizedTitle: "hero", normalizedText: "hero returns", aliases: [], currentContext: true, explicitReference: true, similarity: 0.8, sourceUpdatedAt: now, now });
    expect(exact.score).toBe(1_900); expect(exact.reasons).toEqual(["exact", "all_tokens", "fuzzy", "explicit_reference", "current_context", "recent"]);
    const prefix = scoreSearchResult({ normalizedQuery: "hero", normalizedTitle: "heroic", normalizedText: "heroic return", aliases: [], currentContext: false, explicitReference: false, similarity: 0, sourceUpdatedAt: new Date("2026-08-01"), now });
    expect(prefix.reasons).toEqual(["prefix", "all_tokens", "recent_30d"]);
    const phrase = scoreSearchResult({ normalizedQuery: "lost city", normalizedTitle: "chapter", normalizedText: "the lost city waits", aliases: [], currentContext: false, explicitReference: false, similarity: 0, sourceUpdatedAt: new Date("2020-01-01"), now });
    expect(phrase.reasons).toEqual(["phrase", "all_tokens"]);
  });
  it("registers every active provider once after S11 activation", async () => {
    const registry = new SearchProviderRegistry();
    const active = { types: activeSearchDocumentTypes, state: "ACTIVE" as const, collect: vi.fn().mockResolvedValue([]) };
    registry.register(active);
    expect(registry.states().filter((item) => item.state === "ACTIVE")).toHaveLength(activeSearchDocumentTypes.length);
    expect(registry.states().filter((item) => item.state === "DEPENDENCY_UNAVAILABLE")).toEqual([]);
    expect(registry.provider("NOTE")).toBe(active);
    expect(() => registry.register(active)).toThrow(/already registered/u);
    expect(registry.provider("CHAPTER")).toBe(active); expect(registry.provider("TIMELINE_EVENT")?.state).toBe("ACTIVE");
  });

  it("keeps SearchDocument upserts inside bounded database transactions", async () => {
    const projectId = "00000000-0000-4000-8000-000000000041";
    const actor: SessionActor = {
      userId: "00000000-0000-4000-8000-000000000042",
      workspaceId: "00000000-0000-4000-8000-000000000043",
      role: "OWNER",
      sessionId: "00000000-0000-4000-8000-000000000044",
    };
    const emptyModel = () => ({ findMany: vi.fn().mockResolvedValue([]) });
    const transaction = vi.fn(async (queries: Array<Promise<unknown>>) => Promise.all(queries));
    const searchDocument = {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      upsert: vi.fn().mockResolvedValue({}),
    };
    const prisma = {
      project: {
        findFirst: vi.fn().mockResolvedValue({
          id: projectId,
          workspaceId: actor.workspaceId,
          structuralVersion: 1,
          updatedAt: new Date("2026-09-20T00:00:00.000Z"),
        }),
      },
      chapter: emptyModel(),
      chapterOutline: emptyModel(),
      plotOutline: emptyModel(),
      volumeOutline: emptyModel(),
      milestone: emptyModel(),
      storyEntity: emptyModel(),
      storyChange: emptyModel(),
      relationType: emptyModel(),
      storyReference: emptyModel(),
      capture: emptyModel(),
      timelineEvent: emptyModel(),
      note: emptyModel(),
      researchItem: emptyModel(),
      searchDocument,
      $transaction: transaction,
    } as unknown as ConstructorParameters<typeof PrismaSearchRepository>[0];

    const result = await new PrismaSearchRepository(prisma).synchronize(actor, projectId);

    expect(result).toMatchObject({ insertedOrUpdated: 10, removed: 0, sourceCount: 10 });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction.mock.calls.map(([batch]) => batch.length)).toEqual([8, 2]);
    expect(searchDocument.upsert).toHaveBeenCalledTimes(10);
  });
});
