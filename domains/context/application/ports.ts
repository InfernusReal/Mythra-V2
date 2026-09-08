import type { SessionActor } from "@/domains/accounts/domain/identity";
import type {
  ContextCardType,
  ContextFieldReadModel,
  ContextQuery,
} from "../domain/types";

export interface ContextOutlineSource {
  id: string;
  title: string;
  purpose: string | null;
  emotionalMovement: string | null;
  plainText: string;
  version: number;
}
export interface ContextMilestoneSource {
  id: string;
  title: string;
  description: string | null;
  role: string;
  weight: number;
  version: number;
}
export interface ContextReferenceSource {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceBlockId: string | null;
  targetType: string;
  targetId: string;
  targetBlockId: string | null;
  relationshipKey: string;
  targetLabel: string;
  version: number;
}
export interface ContextCausalSource {
  id: string;
  relationType: string;
  direction: "UPSTREAM" | "DOWNSTREAM";
  endpointType: string;
  endpointId: string;
  endpointBlockId: string | null;
  endpointLabel: string;
  anchorType: string;
  anchorId: string;
  anchorBlockId: string | null;
  importance: number;
  version: number;
}
export interface ContextIntentSource {
  id: string;
  targetType: string;
  targetId: string;
  blockId: string | null;
  category: string | null;
  customCategory: string | null;
  intentText: string;
  version: number;
}
export interface ContextCaptureSource {
  id: string;
  rawText: string;
  lifecycle: string;
  capturedAt: Date;
  chapterId: string | null;
  blockId: string | null;
  version: number;
}
export interface ContextEntitySource {
  id: string;
  name: string;
  summary: string | null;
  typeName: string;
  typeSystemKey?: string | null;
  version: number;
}
export interface ContextTimelineSource {
  id: string;
  title: string;
  displayLabel: string;
  mode: string;
  version: number;
}
export interface ContextNoteSource {
  id: string;
  title: string;
  body: string;
  version: number;
}
export interface ContextResearchSource {
  id: string;
  title: string;
  kind: string;
  summary: string;
  version: number;
}
export interface ContextSnapshot {
  projectId: string;
  projectStructuralVersion: number;
  chapterId: string;
  chapterVersion: number;
  outline: ContextOutlineSource | null;
  extraOutlines: ContextOutlineSource[];
  milestones: ContextMilestoneSource[];
  references: ContextReferenceSource[];
  causal: ContextCausalSource[];
  intents: ContextIntentSource[];
  captures?: ContextCaptureSource[];
  entities?: ContextEntitySource[];
  timeline?: ContextTimelineSource[];
  notes?: ContextNoteSource[];
  research?: ContextResearchSource[];
  pins: Array<{ cardType: ContextCardType; sourceId: string }>;
  preferences: { mutedTypes: ContextCardType[]; directiveEnabled: boolean };
}

export interface ContextRepository {
  load(
    actor: SessionActor,
    chapterId: string,
    query: ContextQuery,
  ): Promise<ContextSnapshot | null>;
  mutatePreference(
    actor: SessionActor,
    projectId: string,
    mutation: {
      action: "PIN" | "UNPIN" | "MUTE" | "UNMUTE" | "SET_DIRECTIVE";
      cardType?: ContextCardType;
      sourceId?: string;
      enabled?: boolean;
    },
  ): Promise<{
    mutedTypes: ContextCardType[];
    directiveEnabled: boolean;
    pinCount: number;
  }>;
  editSource(
    actor: SessionActor,
    projectId: string,
    input: {
      sourceType: "CHAPTER_OUTLINE" | "NARRATIVE_INTENT";
      sourceId: string;
      expectedVersion: number;
      expectedStructuralVersion: number;
      field: "purpose" | "intentText";
      value: string;
    },
  ): Promise<{
    sourceId: string;
    sourceVersion: number;
    projectStructuralVersion: number;
  }>;
}

export interface ContextResolver {
  resolve(
    snapshot: ContextSnapshot,
    query: ContextQuery,
  ): ContextFieldReadModel;
}
