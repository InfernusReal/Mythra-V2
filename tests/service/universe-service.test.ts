import { describe, expect, it, vi } from "vitest";
import { UniverseService } from "@/domains/universe/application/service";
import type { UniverseRepository } from "@/domains/universe/application/ports";
import type { Logger } from "@/lib/observability/logger";

const id = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = {
  userId: id(1),
  workspaceId: id(2),
  sessionId: id(3),
  role: "OWNER" as const,
};
const entity = {
  id: id(5),
  projectId: id(4),
  typeId: id(6),
  typeKey: "custom",
  typeName: "Custom",
  name: "Private name",
  aliases: [],
  summary: "Private summary",
  status: "ACTIVE" as const,
  tags: [],
  icon: null,
  colorToken: null,
  version: 1,
  updatedAt: new Date().toISOString(),
  fieldValues: [],
};
function setup() {
  const repository = {
    catalog: vi.fn().mockResolvedValue({
      entityTypes: [],
      relationTypes: [],
      projectStructuralVersion: 1,
    }),
    list: vi.fn().mockResolvedValue({
      entities: [entity],
      nextCursor: null,
      projectStructuralVersion: 1,
    }),
    create: vi.fn().mockResolvedValue({ entity, projectStructuralVersion: 2 }),
    quickCreate: vi.fn().mockResolvedValue({
      entity,
      referenceId: id(7),
      projectStructuralVersion: 2,
    }),
    detail: vi.fn().mockResolvedValue({
      detail: {
        entity,
        outgoing: [],
        incoming: [],
        snapshots: [],
        backlinks: [],
        backlinkCounts: {},
        backlinkPages: {},
      },
      projectStructuralVersion: 1,
    }),
    update: vi.fn().mockResolvedValue({
      entity: { ...entity, version: 2 },
      projectStructuralVersion: 2,
    }),
    createType: vi
      .fn()
      .mockResolvedValue({ typeId: id(6), projectStructuralVersion: 2 }),
    createRelationType: vi
      .fn()
      .mockResolvedValue({
        relationTypeId: id(8),
        projectStructuralVersion: 2,
      }),
    createRelation: vi.fn().mockResolvedValue({
      relationId: id(8),
      replayed: false,
      projectStructuralVersion: 2,
    }),
    createSnapshot: vi
      .fn()
      .mockResolvedValue({ snapshotId: id(9), projectStructuralVersion: 2 }),
  } satisfies UniverseRepository;
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  } as unknown as Logger;
  return {
    service: new UniverseService(repository, logger),
    repository,
    logger,
  };
}
describe("Universe service", () => {
  it("validates and dispatches every S9 operation", async () => {
    const { service, repository } = setup();
    await service.catalog(actor, id(4), id(10));
    await service.list(actor, id(4), { limit: 50 }, id(10));
    await service.create(
      actor,
      id(4),
      { typeId: id(6), name: "Private", expectedStructuralVersion: 1 },
      id(10),
    );
    await service.quickCreate(
      actor,
      id(4),
      {
        typeId: id(6),
        name: "Private",
        chapterId: id(11),
        blockId: "block",
        selectionAnchor: 1,
        selectionHead: 2,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.detail(actor, id(4), id(5), id(10));
    await service.update(
      actor,
      id(4),
      id(5),
      {
        expectedEntityVersion: 1,
        expectedStructuralVersion: 1,
        status: "ARCHIVED",
      },
      id(10),
    );
    await service.createType(
      actor,
      id(4),
      {
        key: "custom_type",
        name: "Private type",
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.createRelationType(
      actor,
      id(4),
      {
        key: "mentor_of",
        forwardLabel: "Mentor of",
        reverseLabel: "Mentored by",
        directional: true,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.createRelation(
      actor,
      id(4),
      {
        fromEntityId: id(5),
        toEntityId: id(12),
        relationTypeId: id(8),
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.createSnapshot(
      actor,
      id(4),
      id(5),
      {
        anchorType: "UNANCHORED",
        state: { secret: "private" },
        orderIndex: 0,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    expect(repository.createSnapshot).toHaveBeenCalledOnce();
  });
  it("never places names, summaries, selected text, notes, or state in trace metadata", async () => {
    const { service, logger } = setup();
    await service.create(
      actor,
      id(4),
      {
        typeId: id(6),
        name: entity.name,
        summary: entity.summary,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.quickCreate(
      actor,
      id(4),
      {
        typeId: id(6),
        name: entity.name,
        note: "Private note",
        chapterId: id(11),
        blockId: "block",
        selectionAnchor: 1,
        selectionHead: 8,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    await service.createSnapshot(
      actor,
      id(4),
      id(5),
      {
        anchorType: "UNANCHORED",
        state: { secret: "private state" },
        note: "Private state note",
        orderIndex: 0,
        expectedStructuralVersion: 1,
      },
      id(10),
    );
    const logs = JSON.stringify(vi.mocked(logger.info).mock.calls);
    for (const forbidden of [
      entity.name,
      entity.summary,
      "Private note",
      "private state",
      "Private state note",
    ])
      expect(logs).not.toContain(forbidden);
  });
});
