import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@/lib/observability/logger";
import { SearchService } from "@/domains/search/application/service";
import type { SearchRepository } from "@/domains/search/application/ports";
import { SearchProviderRegistry, dormantS11SearchProvider } from "@/domains/search/domain/provider-registry";
import { LanguageService } from "@/domains/language/application/service";
import type { DictionaryProvider, VocabularyRepository } from "@/domains/language/application/ports";

const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = { userId: id(1), workspaceId: id(2), sessionId: id(3), role: "OWNER" as const };
const logger = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() }) as unknown as Logger;

describe("Search and Language services", () => {
  it("synchronizes before querying, exposes dormant providers and delegates structured causal actions", async () => {
    const repository = { synchronize: vi.fn().mockResolvedValue({ insertedOrUpdated: 2, removed: 1, sourceCount: 3, capped: false, projectStructuralVersion: 5 }), search: vi.fn().mockResolvedValue({ projectId: id(4), projectStructuralVersion: 5, groups: [], page: { returned: 0, limit: 40, nextCursor: null, total: 0 } }) } satisfies SearchRepository;
    const providers = new SearchProviderRegistry(); providers.register({ types: ["CHAPTER"], state: "ACTIVE", collect: vi.fn().mockResolvedValue([]) }); providers.register(dormantS11SearchProvider());
    const causality = { getNeighborhood: vi.fn().mockResolvedValue({ paths: [] }) }; const log = logger();
    const service = new SearchService(repository, providers, causality, log);
    const result = await service.query(actor, id(4), { query: "private query" }, id(9));
    expect(repository.synchronize).toHaveBeenCalledBefore(repository.search); expect(result.synchronized.sourceCount).toBe(3); expect(result.providerStates.find((item) => item.type === "NOTE")?.state).toBe("DEPENDENCY_UNAVAILABLE");
    await service.causalAction(actor, id(4), { endpointType: "STORY_CHANGE", endpointId: id(5), action: "WHY" }, id(9));
    expect(causality.getNeighborhood).toHaveBeenCalledWith(actor, id(4), expect.objectContaining({ direction: "UPSTREAM", endpointType: "STORY_CHANGE" }), id(9));
    expect(JSON.stringify(vi.mocked(log.info).mock.calls)).not.toContain("private query");
  });
  it("returns ready/not-found/unavailable Language states and persists vocabulary without logging content", async () => {
    const dictionary = { lookup: vi.fn().mockResolvedValueOnce({ senses: [{ partOfSpeech: "adjective", definition: "private definition", nuance: null, synonyms: ["excellent"], examples: [] }], antonyms: ["bad"] }).mockResolvedValueOnce({ senses: [], antonyms: [] }).mockRejectedValueOnce(new Error("provider failed")) } satisfies DictionaryProvider;
    const vocabulary = { isSaved: vi.fn().mockResolvedValue(false), mutate: vi.fn().mockResolvedValue({ saved: true, version: 1 }), list: vi.fn().mockResolvedValue([]) } satisfies VocabularyRepository;
    const log = logger(); const service = new LanguageService(dictionary, vocabulary, log);
    expect((await service.lookup(actor, id(4), { selection: "private term" }, id(9))).state).toBe("READY");
    expect((await service.lookup(actor, id(4), { selection: "unknown" }, id(9))).state).toBe("NOT_FOUND");
    expect((await service.lookup(actor, id(4), { selection: "failure" }, id(9))).state).toBe("UNAVAILABLE");
    await service.mutateVocabulary(actor, id(4), { action: "SAVE", term: "private term", definition: "private definition" }, id(9)); await service.listVocabulary(actor, id(4), id(9));
    expect(vocabulary.mutate).toHaveBeenCalledWith(actor, id(4), expect.objectContaining({ normalizedTerm: "private_term" }));
    const logs = JSON.stringify([vi.mocked(log.info).mock.calls, vi.mocked(log.warn).mock.calls]); expect(logs).not.toContain("private term"); expect(logs).not.toContain("private definition");
  });
});
