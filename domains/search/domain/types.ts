import { z } from "zod";

export const activeSearchDocumentTypes = [
  "CHAPTER",
  "CHAPTER_OUTLINE",
  "PLOT_OUTLINE",
  "VOLUME_OUTLINE",
  "MILESTONE",
  "ENTITY",
  "STORY_CHANGE",
  "CAUSAL_RELATION_TYPE",
  "UNIVERSE_RELATION_TYPE",
  "STORY_REFERENCE",
  "CAPTURE",
] as const;

export const dormantSearchDocumentTypes = ["TIMELINE_EVENT", "NOTE", "RESEARCH"] as const;
export const searchDocumentTypes = [...activeSearchDocumentTypes, ...dormantSearchDocumentTypes] as const;
export type SearchDocumentType = (typeof searchDocumentTypes)[number];
export type ActiveSearchDocumentType = (typeof activeSearchDocumentTypes)[number];

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(160),
  limit: z.coerce.number().int().min(1).max(100).default(40),
  cursor: z.string().regex(/^offset:\d+$/u).optional(),
  chapterId: z.string().uuid().optional(),
  blockId: z.string().uuid().optional(),
  types: z.array(z.enum(searchDocumentTypes)).min(1).max(searchDocumentTypes.length).optional(),
}).strict();

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchActionKinds = ["PEEK", "OPEN", "INSERT_REFERENCE", "ATTACH_REFERENCE", "COPY", "JUMP_TO_BLOCK", "WHY", "DEPENDS"] as const;
export type SearchActionKind = (typeof searchActionKinds)[number];

export interface SearchAction {
  kind: SearchActionKind;
  label: string;
  href?: string;
  endpointType?: string;
  endpointId?: string;
  blockId?: string;
}

export interface SearchResult {
  id: string;
  documentType: SearchDocumentType;
  sourceId: string;
  sourceKey: string;
  blockId: string | null;
  title: string;
  snippet: string;
  sourceVersion: number;
  sourceUpdatedAt: string;
  indexedAt: string;
  freshness: "CURRENT" | "REFRESHED";
  rank: number;
  matchReasons: string[];
  explicitReference: boolean;
  currentContext: boolean;
  actions: SearchAction[];
  metadata: Record<string, unknown>;
}

export interface SearchGroup {
  type: SearchDocumentType;
  label: string;
  total: number;
  results: SearchResult[];
  hasMore: boolean;
}

export interface SearchReadModel {
  projectId: string;
  projectStructuralVersion: number;
  groups: SearchGroup[];
  providerStates: Array<{ type: SearchDocumentType; state: "ACTIVE" | "DEPENDENCY_UNAVAILABLE" }>;
  page: { returned: number; limit: number; nextCursor: string | null; total: number };
  synchronized: { insertedOrUpdated: number; removed: number; sourceCount: number; capped: boolean };
}

export interface SearchProjectionDocument {
  documentType: ActiveSearchDocumentType;
  sourceId: string;
  sourceKey: string;
  ownerUserId?: string;
  blockId?: string;
  title: string;
  bodyText: string;
  aliases: string[];
  metadata: Record<string, unknown>;
  sourceVersion: number;
  sourceUpdatedAt: Date;
}

export interface SearchScoreInput {
  normalizedQuery: string;
  normalizedTitle: string;
  normalizedText: string;
  aliases: string[];
  currentContext: boolean;
  explicitReference: boolean;
  similarity: number;
  sourceUpdatedAt: Date;
  now: Date;
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}+/gu, "").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/gu, " ");
}

export function searchOffset(cursor?: string): number {
  if (!cursor) return 0;
  return Number.parseInt(cursor.slice("offset:".length), 10);
}

export function scoreSearchResult(input: SearchScoreInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (input.normalizedTitle === input.normalizedQuery || input.aliases.includes(input.normalizedQuery)) { score += 1_000; reasons.push("exact"); }
  else if (input.normalizedTitle.startsWith(input.normalizedQuery) || input.aliases.some((alias) => alias.startsWith(input.normalizedQuery))) { score += 700; reasons.push("prefix"); }
  else if (input.normalizedText.includes(input.normalizedQuery)) { score += 500; reasons.push("phrase"); }
  const tokens = input.normalizedQuery.split(" ").filter(Boolean);
  if (tokens.length > 0 && tokens.every((token) => input.normalizedText.includes(token))) { score += 300; reasons.push("all_tokens"); }
  if (input.similarity > 0) { score += Math.round(Math.min(1, input.similarity) * 250); reasons.push("fuzzy"); }
  if (input.explicitReference) { score += 200; reasons.push("explicit_reference"); }
  if (input.currentContext) { score += 150; reasons.push("current_context"); }
  const ageDays = Math.max(0, (input.now.getTime() - input.sourceUpdatedAt.getTime()) / 86_400_000);
  if (ageDays <= 7) { score += 50; reasons.push("recent"); }
  else if (ageDays <= 30) { score += 20; reasons.push("recent_30d"); }
  return { score, reasons };
}

export const searchGroupLabels: Record<SearchDocumentType, string> = {
  CHAPTER: "Chapters",
  CHAPTER_OUTLINE: "Chapter outlines",
  PLOT_OUTLINE: "Plot outline",
  VOLUME_OUTLINE: "Volume outlines",
  MILESTONE: "Milestones",
  ENTITY: "Entities",
  STORY_CHANGE: "Story Changes",
  CAUSAL_RELATION_TYPE: "Causal relation types",
  UNIVERSE_RELATION_TYPE: "Universe relation types",
  STORY_REFERENCE: "References",
  CAPTURE: "Captures",
  TIMELINE_EVENT: "Timeline events",
  NOTE: "Notes",
  RESEARCH: "Research",
};
