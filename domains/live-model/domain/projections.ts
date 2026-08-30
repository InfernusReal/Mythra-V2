import { createHash } from "node:crypto";
import type { LiveModelProjectionKind } from "./events";

export type ProjectionFreshness = "FRESH" | "UPDATING" | "STALE" | "FAILED";

export interface ProjectionProvenance {
  sourceType: string;
  sourceId: string;
  sourceVersion: number;
  blockId?: string;
}

export interface NarrativeDirectiveItem {
  id: string;
  label: string;
  rank: number;
  provenance: ProjectionProvenance;
}

export interface DurableNarrativeDirectiveProjection {
  projectStructuralVersion: number;
  chapterId: string;
  sourceObjectVersions: Readonly<Record<string, number>>;
  purpose: NarrativeDirectiveItem | null;
  purposeItems: NarrativeDirectiveItem[];
  advanceItems: NarrativeDirectiveItem[];
  preserveItems: NarrativeDirectiveItem[];
  readerOutcomeItems: NarrativeDirectiveItem[];
  nextItems: NarrativeDirectiveItem[];
  becauseItems: NarrativeDirectiveItem[];
  consequenceItems: NarrativeDirectiveItem[];
  rankedContextItems: NarrativeDirectiveItem[];
  generatedAt: string;
  freshness: ProjectionFreshness;
}

export const semanticCoordinateOrder = [
  "PROJECT",
  "PLOT",
  "PLOT_OUTLINE",
  "VOLUME",
  "VOLUME_OUTLINE",
  "MILESTONE_THREAD",
  "CHAPTER_OUTLINE",
  "CHAPTER",
  "SCENE",
  "STORY_CHANGE",
  "BLOCK",
] as const;

export type SemanticCoordinateLevel = (typeof semanticCoordinateOrder)[number];

export interface SemanticCoordinateItem {
  level: SemanticCoordinateLevel;
  id: string;
  relationship: "OWNERSHIP" | "ABSTRACTION" | "RELEVANCE" | "CONTENT";
}

export interface DurableSemanticCoordinateProjection {
  activeAnchor: SemanticCoordinateItem;
  projectStructuralVersion: number;
  orderedPath: SemanticCoordinateItem[];
  ancestorPath: SemanticCoordinateItem[];
  crossCuttingMilestoneThreadIds: string[];
  neighborhoodSummaries: Array<{ level: SemanticCoordinateLevel; count: number }>;
}

export interface ProjectionCandidate {
  kind: LiveModelProjectionKind;
  scopeType: string;
  scopeId: string;
  projectStructuralVersion: number;
  sourceObjectVersions: Readonly<Record<string, number>>;
  payload: Readonly<Record<string, unknown>>;
  freshness: ProjectionFreshness;
  generatedAt: Date;
  digest: string;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generatedAt")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
    .join(",")}}`;
}

export function projectionDigest(input: Omit<ProjectionCandidate, "digest" | "generatedAt">): string {
  // generatedAt is operational provenance, not semantic content; excluding it makes incremental and full rebuilds comparable.
  return createHash("sha256").update(canonical(input)).digest("hex");
}

export function projectionCandidate(input: Omit<ProjectionCandidate, "digest">): ProjectionCandidate {
  const digest = projectionDigest({ kind: input.kind, scopeType: input.scopeType, scopeId: input.scopeId, projectStructuralVersion: input.projectStructuralVersion, sourceObjectVersions: input.sourceObjectVersions, payload: input.payload, freshness: input.freshness });
  return { ...input, digest };
}

export function canReplaceProjection(current: Pick<ProjectionCandidate, "projectStructuralVersion" | "sourceObjectVersions"> | null, candidate: ProjectionCandidate): boolean {
  if (!current) return true;
  if (candidate.projectStructuralVersion < current.projectStructuralVersion) return false;
  if (candidate.projectStructuralVersion > current.projectStructuralVersion) return true;
  return Object.entries(candidate.sourceObjectVersions).every(([key, version]) => version >= (current.sourceObjectVersions[key] ?? 0));
}

export function orderDirectiveItems(items: readonly NarrativeDirectiveItem[], cap = 8): NarrativeDirectiveItem[] {
  return [...items].sort((left, right) => right.rank - left.rank || left.id.localeCompare(right.id)).slice(0, cap);
}

export function buildDurableDirective(input: Omit<DurableNarrativeDirectiveProjection, "purpose" | "purposeItems" | "advanceItems" | "preserveItems" | "readerOutcomeItems" | "nextItems" | "becauseItems" | "consequenceItems" | "rankedContextItems"> & {
  purposeItems?: readonly NarrativeDirectiveItem[];
  advanceItems?: readonly NarrativeDirectiveItem[];
  preserveItems?: readonly NarrativeDirectiveItem[];
  readerOutcomeItems?: readonly NarrativeDirectiveItem[];
  nextItems?: readonly NarrativeDirectiveItem[];
  becauseItems?: readonly NarrativeDirectiveItem[];
  consequenceItems?: readonly NarrativeDirectiveItem[];
  rankedContextItems?: readonly NarrativeDirectiveItem[];
}): DurableNarrativeDirectiveProjection {
  const purposeItems = orderDirectiveItems(input.purposeItems ?? []);
  return {
    ...input,
    purpose: purposeItems[0] ?? null,
    purposeItems,
    advanceItems: orderDirectiveItems(input.advanceItems ?? []),
    preserveItems: orderDirectiveItems(input.preserveItems ?? []),
    readerOutcomeItems: orderDirectiveItems(input.readerOutcomeItems ?? []),
    nextItems: orderDirectiveItems(input.nextItems ?? []),
    becauseItems: orderDirectiveItems(input.becauseItems ?? []),
    consequenceItems: orderDirectiveItems(input.consequenceItems ?? []),
    rankedContextItems: orderDirectiveItems(input.rankedContextItems ?? []),
  };
}

export function buildDurableSemanticCoordinate(input: {
  projectId: string;
  projectStructuralVersion: number;
  plotId?: string | null;
  plotOutlineId?: string | null;
  volumeId?: string | null;
  volumeOutlineId?: string | null;
  milestoneThreadIds?: readonly string[];
  chapterOutlineId?: string | null;
  chapterId?: string | null;
  sceneId?: string | null;
  storyChangeId?: string | null;
  blockId?: string | null;
  neighborhoodSummaries?: DurableSemanticCoordinateProjection["neighborhoodSummaries"];
}): DurableSemanticCoordinateProjection {
  const ancestors: SemanticCoordinateItem[] = [{ level: "PROJECT", id: input.projectId, relationship: "OWNERSHIP" }];
  if (input.plotId) ancestors.push({ level: "PLOT", id: input.plotId, relationship: "OWNERSHIP" });
  if (input.plotOutlineId) ancestors.push({ level: "PLOT_OUTLINE", id: input.plotOutlineId, relationship: "ABSTRACTION" });
  if (input.volumeId) ancestors.push({ level: "VOLUME", id: input.volumeId, relationship: "OWNERSHIP" });
  if (input.volumeOutlineId) ancestors.push({ level: "VOLUME_OUTLINE", id: input.volumeOutlineId, relationship: "ABSTRACTION" });
  if (input.chapterOutlineId) ancestors.push({ level: "CHAPTER_OUTLINE", id: input.chapterOutlineId, relationship: "ABSTRACTION" });
  if (input.chapterId) ancestors.push({ level: "CHAPTER", id: input.chapterId, relationship: "OWNERSHIP" });
  if (input.sceneId) ancestors.push({ level: "SCENE", id: input.sceneId, relationship: "ABSTRACTION" });
  if (input.storyChangeId) ancestors.push({ level: "STORY_CHANGE", id: input.storyChangeId, relationship: "RELEVANCE" });
  if (input.blockId) ancestors.push({ level: "BLOCK", id: input.blockId, relationship: "CONTENT" });
  const milestoneThreadIds = [...new Set(input.milestoneThreadIds ?? [])].sort();
  const crossCutting = milestoneThreadIds.map<SemanticCoordinateItem>((id) => ({ level: "MILESTONE_THREAD", id, relationship: "RELEVANCE" }));
  const orderedPath = [...ancestors, ...crossCutting].sort((left, right) => semanticCoordinateOrder.indexOf(left.level) - semanticCoordinateOrder.indexOf(right.level) || left.id.localeCompare(right.id));
  return { activeAnchor: orderedPath.at(-1) ?? ancestors[0]!, projectStructuralVersion: input.projectStructuralVersion, orderedPath, ancestorPath: ancestors, crossCuttingMilestoneThreadIds: milestoneThreadIds, neighborhoodSummaries: input.neighborhoodSummaries ?? [] };
}
