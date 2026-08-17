import type { SessionActor } from "@/domains/accounts/domain/identity";
import type {
  UniverseEntityDetail,
  UniverseEntitySummary,
} from "../domain/types";

export type UniverseCatalog = {
  entityTypes: Array<{
    id: string;
    key: string;
    systemKey: string | null;
    name: string;
    description: string | null;
    icon: string | null;
    locale: string;
    fields: Array<{
      id: string;
      key: string;
      label: string;
      fieldType: string;
      requiredByUser: boolean;
      orderIndex: number;
      config: unknown;
    }>;
  }>;
  relationTypes: Array<{
    id: string;
    key: string;
    systemKey: string | null;
    forwardLabel: string;
    reverseLabel: string;
    directional: boolean;
  }>;
};

export interface UniverseRepository {
  catalog(
    actor: SessionActor,
    projectId: string,
  ): Promise<UniverseCatalog & { projectStructuralVersion: number }>;
  list(
    actor: SessionActor,
    projectId: string,
    query: {
      typeId?: string;
      status: "ACTIVE" | "ARCHIVED";
      tag?: string;
      cursor?: string;
      limit: number;
    },
  ): Promise<{
    entities: UniverseEntitySummary[];
    nextCursor: string | null;
    projectStructuralVersion: number;
  }>;
  create(
    actor: SessionActor,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<{
    entity: UniverseEntitySummary;
    projectStructuralVersion: number;
  }>;
  quickCreate(
    actor: SessionActor,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<{
    entity: UniverseEntitySummary;
    referenceId: string;
    projectStructuralVersion: number;
  }>;
  detail(
    actor: SessionActor,
    projectId: string,
    entityId: string,
  ): Promise<{
    detail: UniverseEntityDetail;
    projectStructuralVersion: number;
  }>;
  update(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    input: Record<string, unknown>,
  ): Promise<{
    entity: UniverseEntitySummary;
    projectStructuralVersion: number;
  }>;
  createType(
    actor: SessionActor,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<{ typeId: string; projectStructuralVersion: number }>;
  createRelationType(
    actor: SessionActor,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<{ relationTypeId: string; projectStructuralVersion: number }>;
  createRelation(
    actor: SessionActor,
    projectId: string,
    input: Record<string, unknown>,
  ): Promise<{
    relationId: string;
    replayed: boolean;
    projectStructuralVersion: number;
  }>;
  createSnapshot(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    input: Record<string, unknown>,
  ): Promise<{ snapshotId: string; projectStructuralVersion: number }>;
}
