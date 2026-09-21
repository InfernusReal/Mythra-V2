import { errors } from "@/lib/contracts/errors";
import { endpointKey, type CausalEndpoint, type CausalRelationState, type CausalRelationType } from "./types";

export interface CausalEdge {
  id: string; source: CausalEndpoint; target: CausalEndpoint; relationType: CausalRelationType;
  state: CausalRelationState; isHard: boolean; temporalProgression: boolean; mutualStateSemantics: boolean;
  provenanceType: string; provenanceNote: string | null;
}

export interface CausalPathStep { relationId: string; relationType: CausalRelationType; from: CausalEndpoint; to: CausalEndpoint; provenanceType: string; provenanceNote: string | null }
export interface CausalPath { endpoint: CausalEndpoint; direction: "UPSTREAM" | "DOWNSTREAM"; depth: number; steps: CausalPathStep[] }

export function wouldCreateForbiddenHardRequiresCycle(edges: readonly CausalEdge[], candidate: CausalEdge, edgeBudget = 5_000): boolean {
  if (!candidate.isHard || candidate.relationType !== "REQUIRES" || candidate.state !== "ACTIVE") return false;
  if (candidate.temporalProgression || candidate.mutualStateSemantics) return false;
  if (edges.length > edgeBudget) throw errors.dependencyUnavailable();
  const adjacency = new Map<string, string[]>();
  for (const edge of [...edges, candidate]) {
    if (!edge.isHard || edge.relationType !== "REQUIRES" || edge.state !== "ACTIVE" || edge.temporalProgression || edge.mutualStateSemantics) continue;
    const source = endpointKey(edge.source); const target = endpointKey(edge.target);
    adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
  }
  const source = endpointKey(candidate.source); const stack = [endpointKey(candidate.target)]; const visited = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current); stack.push(...(adjacency.get(current) ?? []));
  }
  return false;
}

export function assertHardRequiresInvariant(edges: readonly CausalEdge[], candidate: CausalEdge, edgeBudget = 5_000): void {
  if (wouldCreateForbiddenHardRequiresCycle(edges, candidate, edgeBudget)) throw errors.integrity();
}

export function traverseCausalGraph(edges: readonly CausalEdge[], root: CausalEndpoint, options: { direction: "UPSTREAM" | "DOWNSTREAM" | "BOTH"; maxDepth: number; nodeBudget: number; edgeBudget: number; pathBudget: number }): { paths: CausalPath[]; nodeCount: number; edgeCount: number; truncated: boolean } {
  const filtered = edges.slice(0, options.edgeBudget + 1); const truncatedInput = filtered.length > options.edgeBudget; const usable = filtered.slice(0, options.edgeBudget);
  const queue: Array<{ endpoint: CausalEndpoint; direction: "UPSTREAM" | "DOWNSTREAM"; steps: CausalPathStep[] }> = [];
  if (options.direction !== "DOWNSTREAM") queue.push({ endpoint: root, direction: "UPSTREAM", steps: [] });
  if (options.direction !== "UPSTREAM") queue.push({ endpoint: root, direction: "DOWNSTREAM", steps: [] });
  const visited = new Set<string>([endpointKey(root)]); const paths: CausalPath[] = []; let scannedEdges = 0; let truncated = truncatedInput;
  while (queue.length && paths.length < options.pathBudget && visited.size < options.nodeBudget) {
    const current = queue.shift()!; const key = endpointKey(current.endpoint);
    if (current.steps.length >= options.maxDepth) { if (usable.some((edge) => endpointKey(current.direction === "UPSTREAM" ? edge.target : edge.source) === key)) truncated = true; continue; }
    const direct = usable.filter((edge) => endpointKey(current.direction === "UPSTREAM" ? edge.target : edge.source) === key);
    for (const edge of direct) {
      scannedEdges += 1; const next = current.direction === "UPSTREAM" ? edge.source : edge.target;
      const step: CausalPathStep = { relationId: edge.id, relationType: edge.relationType, from: current.direction === "UPSTREAM" ? edge.source : edge.source, to: current.direction === "UPSTREAM" ? edge.target : edge.target, provenanceType: edge.provenanceType, provenanceNote: edge.provenanceNote };
      const steps = [...current.steps, step]; paths.push({ endpoint: next, direction: current.direction, depth: steps.length, steps });
      if (paths.length >= options.pathBudget) { truncated = true; break; }
      const nextKey = endpointKey(next); if (!visited.has(nextKey)) { visited.add(nextKey); queue.push({ endpoint: next, direction: current.direction, steps }); }
      if (visited.size >= options.nodeBudget) { truncated = true; break; }
    }
  }
  if (queue.length) truncated = true;
  return { paths, nodeCount: visited.size, edgeCount: scannedEdges, truncated };
}
