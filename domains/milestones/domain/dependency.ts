import { errors } from "@/lib/contracts/errors";

export interface MilestoneDependencyEdge { sourceMilestoneId: string; targetMilestoneId: string; isHard: boolean; state: "ACTIVE" | "TENTATIVE" | "RETIRED" }

export function wouldCreateHardDependencyCycle(edges: readonly MilestoneDependencyEdge[], sourceId: string, targetId: string): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edge.isHard || edge.state !== "ACTIVE") continue;
    adjacency.set(edge.sourceMilestoneId, [...(adjacency.get(edge.sourceMilestoneId) ?? []), edge.targetMilestoneId]);
  }
  adjacency.set(sourceId, [...(adjacency.get(sourceId) ?? []), targetId]);
  const stack = [targetId]; const visited = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current); stack.push(...(adjacency.get(current) ?? []));
  }
  return false;
}

export function assertNoHardDependencyCycle(edges: readonly MilestoneDependencyEdge[], sourceId: string, targetId: string): void {
  if (wouldCreateHardDependencyCycle(edges, sourceId, targetId)) throw errors.integrity();
}
