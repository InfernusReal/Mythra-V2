import type { MilestoneOverview } from "@/domains/milestones/application/ports";

export const emptyMilestones: MilestoneOverview = {
  milestones: [],
  links: [],
  dependencies: [],
  page: { nodeBudget: 200, edgeBudget: 300, progressEdgeBudget: 20_000, returnedNodes: 0, returnedEdges: 0, hasMoreNodes: false, hasMoreEdges: false, hasMoreProgressEdges: false }
};
