import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import {
  entityCreateSchema,
  entityQuickCreateSchema,
  entityRelationCreateSchema,
  entitySnapshotCreateSchema,
  entityTypeCreateSchema,
  entityUpdateSchema,
  relationTypeCreateSchema,
  universeListSchema,
} from "../domain/types";
import type { UniverseRepository } from "./ports";

export class UniverseService {
  constructor(
    private readonly repository: UniverseRepository,
    private readonly logger: Logger,
  ) {}
  async catalog(actor: SessionActor, projectId: string, requestId: string) {
    const result = await this.repository.catalog(actor, projectId);
    // Console trace S9-UNIVERSE-001: bounded localized Universe catalog loaded without authored field values.
    this.logger.info("universe.catalog_loaded", {
      step: "S9-UNIVERSE-001",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      typeCount: result.entityTypes.length,
      relationTypeCount: result.relationTypes.length,
    });
    return result;
  }
  async list(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const query = universeListSchema.parse(raw);
    const result = await this.repository.list(actor, projectId, query);
    // Console trace S9-UNIVERSE-002: bounded Universe page loaded with filter and count metadata only.
    this.logger.info("universe.page_loaded", {
      step: "S9-UNIVERSE-002",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      status: query.status,
      hasTypeFilter: Boolean(query.typeId),
      returned: result.entities.length,
      hasMore: Boolean(result.nextCursor),
    });
    return result;
  }
  async create(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entityCreateSchema.parse(raw);
    const result = await this.repository.create(actor, projectId, input);
    // Console trace S9-UNIVERSE-003: entity creation recorded with identity, type, count, and version metadata only.
    this.logger.info("universe.entity_created", {
      step: "S9-UNIVERSE-003",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: result.entity.id,
      typeId: input.typeId,
      valueCount: input.values.length,
      structuralVersion: result.projectStructuralVersion,
    });
    return result;
  }
  async quickCreate(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entityQuickCreateSchema.parse(raw);
    const result = await this.repository.quickCreate(actor, projectId, input);
    // Console trace S9-UNIVERSE-004: selection quick-create recorded without entity name, note, or selected prose.
    this.logger.info("universe.entity_quick_created", {
      step: "S9-UNIVERSE-004",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: result.entity.id,
      typeId: input.typeId,
      chapterId: input.chapterId,
      hasBlockAnchor: Boolean(input.blockId),
      selectedLength: input.selectionHead - input.selectionAnchor,
      structuralVersion: result.projectStructuralVersion,
    });
    return result;
  }
  async detail(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    requestId: string,
  ) {
    const result = await this.repository.detail(actor, projectId, entityId);
    // Console trace S9-UNIVERSE-005: entity detail loaded with bounded relationship/history counts only.
    this.logger.info("universe.entity_loaded", {
      step: "S9-UNIVERSE-005",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: entityId,
      relationCount:
        result.detail.outgoing.length + result.detail.incoming.length,
      stateCount: result.detail.snapshots.length,
      backlinkCount: result.detail.backlinks.length,
    });
    return result;
  }
  async update(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entityUpdateSchema.parse(raw);
    const result = await this.repository.update(
      actor,
      projectId,
      entityId,
      input,
    );
    // Console trace S9-UNIVERSE-006: versioned entity update recorded without authored values.
    this.logger.info("universe.entity_updated", {
      step: "S9-UNIVERSE-006",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: entityId,
      entityVersion: result.entity.version,
      structuralVersion: result.projectStructuralVersion,
    });
    return result;
  }
  async createType(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entityTypeCreateSchema.parse(raw);
    const result = await this.repository.createType(actor, projectId, input);
    // Console trace S9-UNIVERSE-007: custom type creation recorded with schema counts and no authored labels.
    this.logger.info("universe.type_created", {
      step: "S9-UNIVERSE-007",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      typeId: result.typeId,
      fieldCount: input.fields.length,
      structuralVersion: result.projectStructuralVersion,
    });
    return result;
  }
  async createRelationType(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = relationTypeCreateSchema.parse(raw);
    const result = await this.repository.createRelationType(
      actor,
      projectId,
      input,
    );
    // Console trace S9-UNIVERSE-010: custom relation-type creation records identity and direction metadata without author labels.
    this.logger.info("universe.relation_type_created", {
      step: "S9-UNIVERSE-010",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      relationTypeId: result.relationTypeId,
      directional: input.directional,
      structuralVersion: result.projectStructuralVersion,
    });
    return result;
  }
  async createRelation(
    actor: SessionActor,
    projectId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entityRelationCreateSchema.parse(raw);
    const result = await this.repository.createRelation(
      actor,
      projectId,
      input,
    );
    // Console trace S9-UNIVERSE-008: explicit entity relation recorded with endpoint identities only.
    this.logger.info("universe.relation_created", {
      step: "S9-UNIVERSE-008",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: input.fromEntityId,
      targetId: input.toEntityId,
      relationTypeId: input.relationTypeId,
      replayed: result.replayed,
    });
    return result;
  }
  async createSnapshot(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    raw: unknown,
    requestId: string,
  ) {
    const input = entitySnapshotCreateSchema.parse(raw);
    const result = await this.repository.createSnapshot(
      actor,
      projectId,
      entityId,
      input,
    );
    // Console trace S9-UNIVERSE-009: immutable entity-state creation recorded without state or note content.
    this.logger.info("universe.state_created", {
      step: "S9-UNIVERSE-009",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      sourceId: entityId,
      targetId: result.snapshotId,
      anchorType: input.anchorType,
      hasAnchor: Boolean(input.anchorId),
      orderIndex: input.orderIndex,
    });
    return result;
  }
}
