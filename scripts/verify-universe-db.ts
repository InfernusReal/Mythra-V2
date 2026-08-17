import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaUniverseRepository } from "../domains/universe/infrastructure/prisma-universe-repository";
import { PrismaCaptureRepository } from "../domains/capture/infrastructure/prisma-capture-repository";
import { createPrismaEndpointRegistry } from "../domains/causality/infrastructure/prisma-endpoint-adapters";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
async function rejected(operation: Promise<unknown>, code: string) {
  try {
    await operation;
    return false;
  } catch (error) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      String(error.code) === code
    );
  }
}

async function verify() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision(
      {
        provider: "s9",
        subject: `owner-${suffix}`,
        email: `owner-${suffix}@example.test`,
        emailVerified: true,
      },
      suffix,
    );
    const outsider = await identities.resolveOrProvision(
      {
        provider: "s9",
        subject: `other-${suffix}`,
        email: `other-${suffix}@example.test`,
        emailVerified: true,
      },
      suffix,
    );
    const actor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const project = await writing.createProject(actor, {
      title: "Universe verifier",
    });
    const chapter = (
      await writing.createChapter(actor, {
        projectId: project.id,
        title: "Universe chapter",
      })
    ).chapter;
    const repository = new PrismaUniverseRepository(prisma);
    const catalog = await repository.catalog(actor, project.id);
    const characterType = catalog.entityTypes.find(
      (type) => type.systemKey === "character",
    );
    if (!characterType) throw new Error("Character template missing.");
    const first = await repository.create(actor, project.id, {
      typeId: characterType.id,
      name: "Private verifier entity",
      aliases: [],
      tags: [],
      values: [],
      expectedStructuralVersion: catalog.projectStructuralVersion,
    });
    const second = await repository.create(actor, project.id, {
      typeId: characterType.id,
      name: "Private related entity",
      aliases: [],
      tags: [],
      values: [],
      expectedStructuralVersion: first.projectStructuralVersion,
    });
    const quick = await repository.quickCreate(actor, project.id, {
      typeId: characterType.id,
      name: "Selected private prose",
      note: "Private selection note",
      chapterId: chapter.id,
      blockId: chapter.document.content[0]!.attrs.blockId,
      selectionAnchor: 1,
      selectionHead: 8,
      expectedStructuralVersion: second.projectStructuralVersion,
    });
    const relationType = catalog.relationTypes.find(
      (type) => type.systemKey === "knows",
    );
    if (!relationType) throw new Error("Relation template missing.");
    const relation = await repository.createRelation(actor, project.id, {
      fromEntityId: first.entity.id,
      toEntityId: second.entity.id,
      relationTypeId: relationType.id,
      expectedStructuralVersion: quick.projectStructuralVersion,
    });
    const relationReplay = await repository.createRelation(actor, project.id, {
      fromEntityId: first.entity.id,
      toEntityId: second.entity.id,
      relationTypeId: relationType.id,
      expectedStructuralVersion: relation.projectStructuralVersion,
    });
    const snapshot = await repository.createSnapshot(
      actor,
      project.id,
      first.entity.id,
      {
        anchorType: "CHAPTER",
        anchorId: chapter.id,
        state: { privateState: "at harbor" },
        note: "Private state note",
        orderIndex: 0,
        expectedStructuralVersion: relationReplay.projectStructuralVersion,
      },
    );
    const resolved = await createPrismaEndpointRegistry(prisma).resolve(
      project.id,
      { type: "ENTITY_STATE", id: snapshot.snapshotId },
    );
    const captureRepository = new PrismaCaptureRepository(prisma);
    const capture = await captureRepository.create(actor, {
      clientCaptureId: randomUUID(),
      projectId: project.id,
      rawText: "Private Capture linked to entity",
      route: `/app/chapters/${chapter.id}`,
      chapterId: chapter.id,
      entityContext: [first.entity.id],
      capturedAt: new Date().toISOString(),
    });
    const converted = await captureRepository.convert(
      actor,
      project.id,
      capture.capture.id,
      {
        conversionType: "ENTITY",
        entityTypeId: characterType.id,
        idempotencyKey: "entity-conversion",
        expectedStructuralVersion: snapshot.projectStructuralVersion,
        targetBlockId: "",
      },
    );
    const detail = await repository.detail(actor, project.id, first.entity.id);
    const crossWorkspaceRejected = await rejected(
      repository.detail(outsiderActor, project.id, first.entity.id),
      "NOT_FOUND",
    );
    const projectVersion = converted.projectStructuralVersion;
    const updated = await repository.update(
      actor,
      project.id,
      first.entity.id,
      {
        expectedEntityVersion: first.entity.version,
        expectedStructuralVersion: projectVersion,
        summary: "Private changed summary",
      },
    );
    const revisions = await prisma.entityRevision.count({
      where: { entityId: first.entity.id },
    });
    const outbox = await prisma.outboxEvent.findMany({
      where: {
        OR: [
          { aggregateId: first.entity.id },
          { aggregateId: snapshot.snapshotId },
        ],
      },
      select: { payload: true },
    });
    const contentFree =
      !JSON.stringify(outbox).includes("Private") &&
      !JSON.stringify(outbox).includes("harbor");
    const constraints = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname IN ('EntityType_scope_check','EntityRelation_no_self_check','EntityStateSnapshot_anchor_check','EntityStateSnapshot_order_check')`;
    if (
      catalog.entityTypes.length !== 13 ||
      !relationReplay.replayed ||
      relation.relationId !== relationReplay.relationId ||
      resolved.endpoint.id !== snapshot.snapshotId ||
      detail.detail.backlinks.length < 1 ||
      !crossWorkspaceRejected ||
      converted.targetType !== "ENTITY" ||
      revisions !== 1 ||
      updated.entity.version !== 2 ||
      !contentFree ||
      Number(constraints[0]?.count ?? 0) !== 4
    )
      throw new Error("S9 Universe database invariant failed.");
    // Console trace S9-DB-001: PostgreSQL verified templates, ownership, references, relations, history, conversion, endpoint and redaction without authored content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S9-DB-001",
        event: "universe_database.verified",
        projectId: project.id,
        entityTypeCount: catalog.entityTypes.length,
        entityId: first.entity.id,
        quickReferenceId: quick.referenceId,
        relationReplayed: relationReplay.replayed,
        stateEndpointActive: true,
        backlinkCount: detail.detail.backlinks.length,
        crossWorkspaceRejected,
        entityConversionActive: converted.targetType === "ENTITY",
        revisionCount: revisions,
        outboxContentFree: contentFree,
        constraintCount: Number(constraints[0]?.count ?? 0),
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function rollback() {
  const sql = await readFile(
    new URL(
      "../prisma/migrations/20260816223000_universe/rollback.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const proseBefore = await client.query(
      `SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" ORDER BY "createdAt" LIMIT 1`,
    );
    const captureBefore = await client.query(
      `SELECT "id", "rawText", "version" FROM "Capture" ORDER BY "createdAt" LIMIT 1`,
    );
    await client.query(sql);
    const tables = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('EntityType','EntityFieldDefinition','StoryEntity','EntityFieldValue','RelationType','EntityRelation','EntityStateSnapshot','EntityRevision')`,
    );
    const proseAfter = proseBefore.rowCount
      ? await client.query(
          `SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" WHERE "id"=$1`,
          [(proseBefore.rows[0] as { id: string }).id],
        )
      : { rows: [] };
    const captureAfter = captureBefore.rowCount
      ? await client.query(
          `SELECT "id", "rawText", "version" FROM "Capture" WHERE "id"=$1`,
          [(captureBefore.rows[0] as { id: string }).id],
        )
      : { rows: [] };
    const captureEnum = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM pg_type WHERE typname='CaptureConversionType'`,
    );
    if (
      tables.rows[0]?.count !== "0" ||
      captureEnum.rows[0]?.count !== "1" ||
      JSON.stringify(proseBefore.rows[0]) !==
        JSON.stringify(proseAfter.rows[0]) ||
      JSON.stringify(captureBefore.rows[0]) !==
        JSON.stringify(captureAfter.rows[0])
    )
      throw new Error("S9 rollback crossed its S8/prose boundary.");
    await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name='20260816223000_universe'`,
    );
    // Console trace S9-DB-002: S9 rollback removed Universe truth while preserving sampled S8 Capture and manuscript bytes.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S9-DB-002",
        event: "universe_database.rollback_verified",
        remainingUniverseTables: 0,
        captureEnumRestored: true,
        proseRowsPreserved: proseBefore.rowCount ?? 0,
        captureRowsPreserved: captureBefore.rowCount ?? 0,
      }),
    );
  } finally {
    await client.end();
  }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
