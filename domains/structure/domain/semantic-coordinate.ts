export const semanticLadder = [
  "SERIES_PROJECT",
  "PLOT",
  "PLOT_OUTLINE",
  "VOLUME",
  "VOLUME_OUTLINE",
  "MILESTONE_THREAD",
  "CHAPTER_OUTLINE",
  "CHAPTER",
  "SCENE",
  "PROSE"
] as const;

export type SemanticLevel = (typeof semanticLadder)[number];
export type SemanticRelationship = "OWNERSHIP" | "ABSTRACTION" | "RELEVANCE" | "CONTENT";
export type SemanticZoomDirection = "OUT" | "IN";

export function orderedAvailableSemanticLevels(levels: readonly SemanticLevel[]): SemanticLevel[] {
  const available = new Set(levels);
  return semanticLadder.filter((level) => available.has(level));
}

export function resolveSemanticZoomLevel(levels: readonly SemanticLevel[], requested: SemanticLevel): SemanticLevel {
  if (!levels.length || levels.includes(requested)) return requested;
  const requestedIndex = semanticLadder.indexOf(requested);
  const outward = [...levels].reverse().find((level) => semanticLadder.indexOf(level) < requestedIndex);
  return outward ?? levels[0]!;
}

export function moveSemanticZoom(levels: readonly SemanticLevel[], current: SemanticLevel, direction: SemanticZoomDirection): SemanticLevel {
  if (!levels.length) return current;
  const currentIndex = levels.indexOf(current);
  const index = currentIndex < 0 ? 0 : currentIndex;
  const nextIndex = Math.min(levels.length - 1, Math.max(0, index + (direction === "IN" ? 1 : -1)));
  return levels[nextIndex]!;
}

export interface SemanticCoordinateInput {
  projectId: string;
  plotId?: string | null;
  plotOutlineId?: string | null;
  volumeId?: string | null;
  volumeOutlineId?: string | null;
  milestoneThreadIds?: readonly string[];
  chapterOutlineId?: string | null;
  chapterId?: string | null;
  sceneId?: string | null;
  proseAnchor?: { blockId: string; selectionAnchor?: number; selectionHead?: number } | null;
}

export interface SemanticCoordinateStep {
  level: SemanticLevel;
  id: string;
  relationship: SemanticRelationship;
}

export interface SemanticCoordinateProjection {
  projectId: string;
  plotOutlineId: string | null;
  volumeOutlineId: string | null;
  orderedPath: SemanticCoordinateStep[];
  ancestorPath: SemanticCoordinateStep[];
  crossCuttingMilestoneThreadIds: string[];
  activeLevel: SemanticLevel;
  proseAnchor: SemanticCoordinateInput["proseAnchor"];
}

export function buildSemanticCoordinate(input: SemanticCoordinateInput): SemanticCoordinateProjection {
  const ownership: SemanticCoordinateStep[] = [{ level: "SERIES_PROJECT", id: input.projectId, relationship: "OWNERSHIP" }];
  if (input.plotId) ownership.push({ level: "PLOT", id: input.plotId, relationship: "OWNERSHIP" });
  if (input.plotOutlineId) ownership.push({ level: "PLOT_OUTLINE", id: input.plotOutlineId, relationship: "ABSTRACTION" });
  if (input.volumeId) ownership.push({ level: "VOLUME", id: input.volumeId, relationship: "OWNERSHIP" });
  if (input.volumeOutlineId) ownership.push({ level: "VOLUME_OUTLINE", id: input.volumeOutlineId, relationship: "ABSTRACTION" });
  const milestones = [...new Set(input.milestoneThreadIds ?? [])].map<SemanticCoordinateStep>((id) => ({ level: "MILESTONE_THREAD", id, relationship: "RELEVANCE" }));
  if (input.chapterOutlineId) ownership.push({ level: "CHAPTER_OUTLINE", id: input.chapterOutlineId, relationship: "ABSTRACTION" });
  if (input.chapterId) ownership.push({ level: "CHAPTER", id: input.chapterId, relationship: "OWNERSHIP" });
  if (input.sceneId) ownership.push({ level: "SCENE", id: input.sceneId, relationship: "ABSTRACTION" });
  if (input.proseAnchor) ownership.push({ level: "PROSE", id: input.proseAnchor.blockId, relationship: "CONTENT" });
  const orderedPath = [...ownership.slice(0, Math.min(5, ownership.length)), ...milestones, ...ownership.slice(Math.min(5, ownership.length))]
    .sort((left, right) => semanticLadder.indexOf(left.level) - semanticLadder.indexOf(right.level));
  return {
    projectId: input.projectId,
    plotOutlineId: input.plotOutlineId ?? null,
    volumeOutlineId: input.volumeOutlineId ?? null,
    orderedPath,
    ancestorPath: ownership,
    crossCuttingMilestoneThreadIds: milestones.map((step) => step.id),
    activeLevel: orderedPath.at(-1)?.level ?? "SERIES_PROJECT",
    proseAnchor: input.proseAnchor ?? null
  };
}
