import type { ContextFieldReadModel } from "@/domains/context/domain/types";
import { normalizeSearchText, searchGroupLabels, type SearchReadModel, type SearchResult } from "@/domains/search/domain/types";

export const degradedCapabilityMatrix = {
  manuscript: "AVAILABLE_LOCAL",
  capture: "AVAILABLE_QUEUED",
  recentChapterSearch: "AVAILABLE_LIMITED",
  cachedContext: "AVAILABLE_STALE",
  structureMutations: "UNAVAILABLE",
  export: "UNAVAILABLE",
  snapshot: "UNAVAILABLE",
  billing: "UNAVAILABLE"
} as const;

const SEARCH_LIMIT = 50;
const contextKey = (chapterId: string) => `mythra:offline:context:${chapterId}`;
const searchKey = (projectId: string) => `mythra:offline:chapter-search:${projectId}`;

export function cacheChapterSearch(projectId: string, model: SearchReadModel, storage: Pick<Storage, "setItem"> = localStorage): void {
  const chapters = model.groups.flatMap((group) => group.results).filter((result) => result.documentType === "CHAPTER").slice(0, SEARCH_LIMIT);
  storage.setItem(searchKey(projectId), JSON.stringify({ projectId, projectStructuralVersion: model.projectStructuralVersion, cachedAt: new Date().toISOString(), chapters }));
}

export function readCachedChapterSearch(projectId: string, query: string, storage: Pick<Storage, "getItem"> = localStorage): SearchReadModel | null {
  try {
    const raw = storage.getItem(searchKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projectId: string; projectStructuralVersion: number; chapters: SearchResult[] };
    if (parsed.projectId !== projectId || !Array.isArray(parsed.chapters)) return null;
    const normalized = normalizeSearchText(query);
    const results = parsed.chapters.filter((result) => normalizeSearchText(`${result.title} ${result.snippet}`).includes(normalized)).slice(0, SEARCH_LIMIT).map((result) => ({ ...result, freshness: "REFRESHED" as const, matchReasons: [...new Set([...result.matchReasons, "offline_cached"])] }));
    return { projectId, projectStructuralVersion: parsed.projectStructuralVersion, groups: results.length ? [{ type: "CHAPTER", label: searchGroupLabels.CHAPTER, total: results.length, results, hasMore: false }] : [], providerStates: [{ type: "CHAPTER", state: "ACTIVE" }], page: { returned: results.length, limit: SEARCH_LIMIT, nextCursor: null, total: results.length }, synchronized: { insertedOrUpdated: 0, removed: 0, sourceCount: parsed.chapters.length, capped: parsed.chapters.length >= SEARCH_LIMIT } };
  } catch { return null; }
}

export function cacheContextModel(model: ContextFieldReadModel, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(contextKey(model.chapterId), JSON.stringify(model));
}

export function readStaleContextModel(chapterId: string, storage: Pick<Storage, "getItem"> = localStorage): ContextFieldReadModel | null {
  try {
    const raw = storage.getItem(contextKey(chapterId));
    if (!raw) return null;
    const model = JSON.parse(raw) as ContextFieldReadModel;
    if (model.chapterId !== chapterId || !Array.isArray(model.descriptors)) return null;
    return { ...model, descriptors: model.descriptors.map((descriptor) => ({ ...descriptor, stale: true })), directive: { ...model.directive, stale: true } };
  } catch { return null; }
}
