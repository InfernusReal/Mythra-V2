import type { CausalOverview } from "@/domains/causality/application/ports";

export const emptyCausality: CausalOverview = { projectStructuralVersion: 6, storyChanges: [], relations: [], endpoints: [], page: { nodeBudget: 200, edgeBudget: 300, returnedNodes: 0, returnedEdges: 0, hasMoreNodes: false, hasMoreEdges: false } };
