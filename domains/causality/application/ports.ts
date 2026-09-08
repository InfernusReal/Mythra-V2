import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ChronologyResult } from "../domain/chronology";
import type {
  CausalEndpoint,
  CausalProvenanceType,
  CausalRelationState,
  CausalRelationType,
} from "../domain/types";

export interface StoryChangeSummary {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  storyTime: number | null;
  discoveryTime: number | null;
  anchor: CausalEndpoint | null;
  isPlaceholder: boolean;
  version: number;
  archivedAt: string | null;
}
export interface CausalRelationSummary {
  id: string;
  source: CausalEndpoint;
  target: CausalEndpoint;
  relationType: CausalRelationType;
  condition: string | null;
  strength: number;
  importance: number;
  state: CausalRelationState;
  isHard: boolean;
  temporalProgression: boolean;
  mutualStateSemantics: boolean;
  note: string | null;
  provenanceType: CausalProvenanceType;
  provenanceNote: string | null;
  version: number;
  archivedAt: string | null;
}
export interface CausalEndpointProjection {
  type: string;
  id: string;
  blockId?: string;
  label: string;
  labelCode?: string;
  labelOrdinal?: number;
  archived: boolean;
}
export interface CausalPathProjection {
  endpoint: CausalEndpointProjection;
  direction: "UPSTREAM" | "DOWNSTREAM";
  depth: number;
  steps: Array<{
    relationId: string;
    relationType: CausalRelationType;
    from: CausalEndpoint;
    to: CausalEndpoint;
    provenanceType: string;
    provenanceNote: string | null;
  }>;
}
export interface CausalTraversalProjection {
  root: CausalEndpointProjection;
  paths: CausalPathProjection[];
  nodeCount: number;
  edgeCount: number;
  truncated: boolean;
  language: "POTENTIALLY_AFFECTED";
}
export interface CausalOverview {
  projectStructuralVersion: number;
  storyChanges: StoryChangeSummary[];
  relations: CausalRelationSummary[];
  endpoints: CausalEndpointProjection[];
  page: {
    nodeBudget: number;
    edgeBudget: number;
    returnedNodes: number;
    returnedEdges: number;
    hasMoreNodes: boolean;
    hasMoreEdges: boolean;
  };
}
export interface CausalMutationResult<T> {
  object: T;
  projectStructuralVersion: number;
  idempotent?: boolean;
}

export interface CausalityRepository {
  assertProjectAccess(actor: SessionActor, projectId: string): Promise<void>;
  getOverview(
    actor: SessionActor,
    projectId: string,
    budget: { nodeBudget: number; edgeBudget: number },
  ): Promise<CausalOverview | null>;
  writeStoryChange(
    actor: SessionActor,
    projectId: string,
    input: {
      expectedStructuralVersion: number;
      storyChangeId?: string;
      kind: string;
      title: string;
      description?: string;
      storyTime?: number;
      discoveryTime?: number;
      anchor?: CausalEndpoint;
      isPlaceholder: boolean;
    },
  ): Promise<CausalMutationResult<StoryChangeSummary>>;
  createRelation(
    actor: SessionActor,
    projectId: string,
    input: {
      expectedStructuralVersion: number;
      source: CausalEndpoint;
      target: CausalEndpoint;
      relationType: CausalRelationType;
      condition?: string;
      strength: number;
      importance: number;
      state: CausalRelationState;
      isHard: boolean;
      temporalProgression: boolean;
      mutualStateSemantics: boolean;
      note?: string;
      provenanceType: CausalProvenanceType;
      provenanceNote?: string;
    },
  ): Promise<CausalMutationResult<CausalRelationSummary>>;
  lifecycleRelation(
    actor: SessionActor,
    projectId: string,
    input: {
      action: "REATTACH" | "RETIRE" | "ARCHIVE";
      expectedStructuralVersion: number;
      relationId: string;
      source?: CausalEndpoint;
      target?: CausalEndpoint;
    },
  ): Promise<CausalMutationResult<CausalRelationSummary>>;
  getNeighborhood(
    actor: SessionActor,
    projectId: string,
    input: {
      endpoint: CausalEndpoint;
      direction: "UPSTREAM" | "DOWNSTREAM" | "BOTH";
      states: CausalRelationState[];
      relationTypes?: CausalRelationType[];
      maxDepth: number;
      nodeBudget: number;
      edgeBudget: number;
      pathBudget: number;
    },
  ): Promise<CausalTraversalProjection>;
  traceImpact(
    actor: SessionActor,
    projectId: string,
    input: {
      endpoint: CausalEndpoint;
      direction: "UPSTREAM" | "DOWNSTREAM" | "BOTH";
      states: CausalRelationState[];
      relationTypes?: CausalRelationType[];
      maxDepth: number;
      nodeBudget: number;
      edgeBudget: number;
      pathBudget: number;
    },
  ): Promise<CausalTraversalProjection>;
  validateChronology(
    actor: SessionActor,
    projectId: string,
    relationId: string,
  ): Promise<{ relation: CausalRelationSummary; chronology: ChronologyResult }>;
}
