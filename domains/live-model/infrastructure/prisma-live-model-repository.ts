import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { PrismaSearchRepository } from "@/domains/search/infrastructure/prisma-search-repository";
import { errors } from "@/lib/contracts/errors";
import type {
  ClaimedOutboxEvent,
  LiveModelRepository,
  LiveModelStatus,
  PersistProjectionResult,
  ProjectionBuildResult,
} from "../application/ports";
import {
  normalizeDomainEvent,
  type NormalizedDomainEvent,
} from "../domain/events";
import { canReplaceProjection } from "../domain/projections";
import {
  isWarningSuppressible,
  type LiveModelWarningType,
} from "../domain/warnings";
import { PrismaLiveModelProjector } from "./projector";

interface ClaimedRow {
  id: string;
  workspaceId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  schemaVersion: number;
  payload: unknown;
  attempts: number;
  leaseOwner: string;
  leasedUntil: Date;
  createdAt: Date;
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function aggregateDigest(digests: readonly string[]): string {
  return createHash("sha256")
    .update([...digests].sort().join(":"), "utf8")
    .digest("hex");
}

export class PrismaLiveModelRepository implements LiveModelRepository {
  private readonly projector: PrismaLiveModelProjector;
  private readonly search: PrismaSearchRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.projector = new PrismaLiveModelProjector(prisma);
    this.search = new PrismaSearchRepository(prisma);
  }

  async claim(
    workerId: string,
    batchSize: number,
    leaseMilliseconds: number,
  ): Promise<ClaimedOutboxEvent[]> {
    const rows = await this.prisma.$queryRaw<ClaimedRow[]>(Prisma.sql`
      WITH candidates AS (
        SELECT "id"
        FROM "OutboxEvent"
        WHERE "deadLetteredAt" IS NULL
          AND "availableAt" <= CURRENT_TIMESTAMP
          AND (
            "status" = 'PENDING'::"OutboxStatus"
            OR ("status" = 'PROCESSING'::"OutboxStatus" AND "leasedUntil" < CURRENT_TIMESTAMP)
          )
        ORDER BY "availableAt" ASC, "createdAt" ASC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      UPDATE "OutboxEvent" AS event
      SET "status" = 'PROCESSING'::"OutboxStatus",
          "attempts" = event."attempts" + 1,
          "leaseOwner" = ${workerId},
          "leasedUntil" = CURRENT_TIMESTAMP + (${leaseMilliseconds} * INTERVAL '1 millisecond'),
          "lastErrorCode" = NULL
      FROM candidates
      WHERE event."id" = candidates."id"
      RETURNING event."id", event."workspaceId", event."aggregateType", event."aggregateId", event."eventType", event."schemaVersion", event."payload", event."attempts", event."leaseOwner", event."leasedUntil", event."createdAt"
    `);
    return rows;
  }

  async deliveryExists(eventId: string): Promise<boolean> {
    return Boolean(
      await this.prisma.liveModelEventDelivery.findUnique({
        where: { eventId },
        select: { id: true },
      }),
    );
  }

  build(
    event: NormalizedDomainEvent,
    generatedAt: Date,
  ): Promise<ProjectionBuildResult> {
    return this.projector.build(event, generatedAt);
  }

  async synchronizeSearch(
    actors: readonly SessionActor[],
    projectId: string,
  ): Promise<{ changed: number; removed: number; sourceCount: number }> {
    const actor = actors[0];
    if (!actor) throw new Error("PROJECT_MEMBER_NOT_AVAILABLE");
    const result = await this.search.synchronize(actor, projectId);
    return {
      changed: result.insertedOrUpdated,
      removed: result.removed,
      sourceCount: result.sourceCount,
    };
  }

  async persist(
    event: NormalizedDomainEvent,
    build: ProjectionBuildResult,
    fullRebuild: boolean,
  ): Promise<PersistProjectionResult> {
    return this.persistInternal(event, build, fullRebuild, true);
  }

  private async persistInternal(
    event: NormalizedDomainEvent,
    build: ProjectionBuildResult,
    fullRebuild: boolean,
    recordDelivery: boolean,
  ): Promise<PersistProjectionResult> {
    return this.prisma.$transaction(
      async (tx) => {
        if (recordDelivery) {
          const delivered = await tx.liveModelEventDelivery.findUnique({
            where: { eventId: event.id },
            select: { outputDigest: true },
          });
          if (delivered) {
            await tx.outboxEvent.updateMany({
              where: { id: event.id },
              data: {
                status: "COMPLETED",
                completedAt: new Date(),
                leaseOwner: null,
                leasedUntil: null,
              },
            });
            return {
              inserted: 0,
              updated: 0,
              staleRejected: 0,
              removed: 0,
              warningsActive: build.warnings.length,
              digest: delivered.outputDigest,
            };
          }
        }
        const currentRows = await tx.liveModelProjection.findMany({
          where: { projectId: build.projectId },
          select: {
            id: true,
            kind: true,
            scopeType: true,
            scopeId: true,
            projectStructuralVersion: true,
            sourceObjectVersions: true,
            digest: true,
          },
        });
        const current = new Map(
          currentRows.map((row) => [
            `${row.kind}:${row.scopeType}:${row.scopeId}`,
            row,
          ]),
        );
        let inserted = 0;
        let updated = 0;
        let staleRejected = 0;
        const activeIds: string[] = [];
        for (const candidate of build.projections) {
          const key = `${candidate.kind}:${candidate.scopeType}:${candidate.scopeId}`;
          const existing = current.get(key);
          const accepted = canReplaceProjection(
            existing
              ? {
                  projectStructuralVersion: existing.projectStructuralVersion,
                  sourceObjectVersions: existing.sourceObjectVersions as Record<
                    string,
                    number
                  >,
                }
              : null,
            candidate,
          );
          if (!accepted) {
            staleRejected += 1;
            if (existing) activeIds.push(existing.id);
            continue;
          }
          const row = await tx.liveModelProjection.upsert({
            where: {
              projectId_kind_scopeType_scopeId: {
                projectId: build.projectId,
                kind: candidate.kind,
                scopeType: candidate.scopeType,
                scopeId: candidate.scopeId,
              },
            },
            create: {
              projectId: build.projectId,
              kind: candidate.kind,
              scopeType: candidate.scopeType,
              scopeId: candidate.scopeId,
              projectStructuralVersion: candidate.projectStructuralVersion,
              sourceObjectVersions: json(candidate.sourceObjectVersions),
              payload: json(candidate.payload),
              digest: candidate.digest,
              freshness: candidate.freshness,
              generatedAt: candidate.generatedAt,
              invalidatedAt:
                candidate.freshness === "FRESH" ? null : candidate.generatedAt,
              lastEventId: recordDelivery ? event.id : null,
            },
            update: {
              projectStructuralVersion: candidate.projectStructuralVersion,
              sourceObjectVersions: json(candidate.sourceObjectVersions),
              payload: json(candidate.payload),
              digest: candidate.digest,
              freshness: candidate.freshness,
              generatedAt: candidate.generatedAt,
              invalidatedAt:
                candidate.freshness === "FRESH" ? null : candidate.generatedAt,
              lastEventId: recordDelivery ? event.id : null,
            },
            select: { id: true },
          });
          activeIds.push(row.id);
          if (existing) updated += 1;
          else inserted += 1;
        }
        const removed = fullRebuild
          ? (
              await tx.liveModelProjection.deleteMany({
                where: { projectId: build.projectId, id: { notIn: activeIds } },
              })
            ).count
          : 0;
        const warningKeys = build.warnings.map((warning) => warning.warningKey);
        for (const warning of build.warnings) {
          await tx.liveModelWarning.upsert({
            where: {
              projectId_warningKey: {
                projectId: build.projectId,
                warningKey: warning.warningKey,
              },
            },
            create: {
              projectId: build.projectId,
              warningKey: warning.warningKey,
              warningType: warning.warningType,
              sourceType: warning.sourceType,
              sourceId: warning.sourceId,
              relatedType: warning.relatedType,
              relatedId: warning.relatedId,
              facts: json(warning.facts),
              projectStructuralVersion: build.projectStructuralVersion,
            },
            update: {
              warningType: warning.warningType,
              sourceType: warning.sourceType,
              sourceId: warning.sourceId,
              relatedType: warning.relatedType,
              relatedId: warning.relatedId,
              facts: json(warning.facts),
              projectStructuralVersion: build.projectStructuralVersion,
              resolvedAt: null,
            },
          });
        }
        await tx.liveModelWarning.updateMany({
          where: {
            projectId: build.projectId,
            warningKey: { notIn: warningKeys },
            resolvedAt: null,
          },
          data: {
            resolvedAt: new Date(),
            projectStructuralVersion: build.projectStructuralVersion,
          },
        });
        const digest = aggregateDigest(
          build.projections.map((candidate) => candidate.digest),
        );
        if (recordDelivery) {
          await tx.liveModelEventDelivery.create({
            data: {
              eventId: event.id,
              projectId: build.projectId,
              handlerKey: "live-model.projector.v1",
              eventSchemaVersion: event.schemaVersion,
              projectStructuralVersion: build.projectStructuralVersion,
              outputDigest: digest,
            },
          });
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              leaseOwner: null,
              leasedUntil: null,
              lastErrorCode: null,
            },
          });
        }
        return {
          inserted,
          updated,
          staleRejected,
          removed,
          warningsActive: build.warnings.length,
          digest,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30_000,
      },
    );
  }

  async completeDuplicate(eventId: string, workerId: string): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: { id: eventId, status: "PROCESSING", leaseOwner: workerId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        leaseOwner: null,
        leasedUntil: null,
      },
    });
  }

  async fail(
    eventId: string,
    workerId: string,
    errorCode: string,
    attempts: number,
    availableAt: Date | null,
  ): Promise<"RETRY" | "DEAD_LETTER"> {
    if (availableAt && attempts < 8) {
      await this.prisma.outboxEvent.updateMany({
        where: { id: eventId, status: "PROCESSING", leaseOwner: workerId },
        data: {
          status: "PENDING",
          availableAt,
          leaseOwner: null,
          leasedUntil: null,
          lastErrorCode: errorCode,
          lastErrorAt: new Date(),
        },
      });
      return "RETRY";
    }
    await this.prisma.outboxEvent.updateMany({
      where: { id: eventId, status: "PROCESSING", leaseOwner: workerId },
      data: {
        status: "FAILED",
        leaseOwner: null,
        leasedUntil: null,
        lastErrorCode: errorCode,
        lastErrorAt: new Date(),
        deadLetteredAt: new Date(),
      },
    });
    return "DEAD_LETTER";
  }

  async getStatus(
    actor: SessionActor,
    projectId: string,
  ): Promise<LiveModelStatus | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: actor.workspaceId,
        status: "ACTIVE",
      },
      select: { structuralVersion: true },
    });
    if (!project) return null;
    const [
      projections,
      warnings,
      pendingEventCount,
      processingEventCount,
      failedEventCount,
      oldest,
    ] = await Promise.all([
      this.prisma.liveModelProjection.findMany({
        where: { projectId },
        orderBy: [{ kind: "asc" }, { scopeType: "asc" }, { scopeId: "asc" }],
        take: 5_000,
        select: {
          kind: true,
          scopeType: true,
          scopeId: true,
          projectStructuralVersion: true,
          freshness: true,
          generatedAt: true,
        },
      }),
      this.prisma.liveModelWarning.findMany({
        where: { projectId, resolvedAt: null },
        orderBy: [{ warningType: "asc" }, { warningKey: "asc" }],
        take: 500,
        select: {
          id: true,
          warningType: true,
          sourceType: true,
          sourceId: true,
          facts: true,
          suppressedAt: true,
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          workspaceId: actor.workspaceId,
          status: "PENDING",
          delivery: { is: null },
          payload: { path: ["projectId"], equals: projectId },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          workspaceId: actor.workspaceId,
          status: "PROCESSING",
          delivery: { is: null },
          payload: { path: ["projectId"], equals: projectId },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          workspaceId: actor.workspaceId,
          status: "FAILED",
          delivery: { is: null },
          payload: { path: ["projectId"], equals: projectId },
        },
      }),
      this.prisma.outboxEvent.findFirst({
        where: {
          workspaceId: actor.workspaceId,
          status: "PENDING",
          delivery: { is: null },
          payload: { path: ["projectId"], equals: projectId },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);
    const now = Date.now();
    return {
      projectId,
      projectStructuralVersion: project.structuralVersion,
      projectionCount: projections.length,
      freshCount: projections.filter((row) => row.freshness === "FRESH").length,
      updatingCount: projections.filter((row) => row.freshness === "UPDATING")
        .length,
      staleCount: projections.filter(
        (row) =>
          row.freshness === "STALE" ||
          row.projectStructuralVersion < project.structuralVersion,
      ).length,
      failedCount: projections.filter((row) => row.freshness === "FAILED")
        .length,
      pendingEventCount,
      processingEventCount,
      failedEventCount,
      oldestPendingAt: oldest?.createdAt.toISOString() ?? null,
      lagMilliseconds: oldest
        ? Math.max(0, now - oldest.createdAt.getTime())
        : 0,
      warnings: warnings.map((warning) => ({
        id: warning.id,
        warningType: warning.warningType,
        sourceType: warning.sourceType,
        sourceId: warning.sourceId,
        facts: warning.facts as Record<string, unknown>,
        suppressed: Boolean(warning.suppressedAt),
        suppressible: isWarningSuppressible(
          warning.warningType as LiveModelWarningType,
        ),
      })),
      projections: projections.map((row) => ({
        ...row,
        kind: String(row.kind),
        freshness:
          row.projectStructuralVersion < project.structuralVersion &&
          row.freshness === "FRESH"
            ? "STALE"
            : String(row.freshness),
        generatedAt: row.generatedAt.toISOString(),
      })),
    };
  }

  async rebuild(actor: SessionActor, projectId: string, generatedAt: Date) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: actor.workspaceId,
        status: "ACTIVE",
      },
      select: { structuralVersion: true },
    });
    if (!project) throw errors.notFound();
    const event: NormalizedDomainEvent = {
      id: "00000000-0000-4000-8000-000000000000",
      workspaceId: actor.workspaceId,
      projectId,
      type: "ProjectCreated",
      originalType: "live_model.rebuild",
      schemaVersion: 1,
      structuralVersion: project.structuralVersion,
      objectType: "PROJECT",
      objectId: projectId,
      createdAt: generatedAt,
    };
    const build = await this.projector.build(event, generatedAt);
    const search = await this.synchronizeSearch(build.searchActors, projectId);
    const markerIndex = build.projections.findIndex(
      (candidate) => candidate.kind === "SEARCH_DOCUMENT",
    );
    if (markerIndex >= 0) {
      const marker = build.projections[markerIndex]!;
      const { projectionCandidate } = await import("../domain/projections");
      build.projections[markerIndex] = projectionCandidate({
        ...marker,
        payload: {
          ...marker.payload,
          indexedDocumentCount: search.sourceCount,
          synchronizationRequired: false,
        },
        freshness: "FRESH",
      });
    }
    const persisted = await this.persistInternal(event, build, true, false);
    const coveredRows = await this.prisma.outboxEvent.findMany({
      where: {
        workspaceId: actor.workspaceId,
        delivery: { is: null },
        createdAt: { lte: generatedAt },
        payload: { path: ["projectId"], equals: projectId },
      },
      orderBy: { createdAt: "asc" },
      take: 10_000,
      select: {
        id: true,
        workspaceId: true,
        aggregateType: true,
        aggregateId: true,
        eventType: true,
        schemaVersion: true,
        payload: true,
        createdAt: true,
      },
    });
    const covered = coveredRows.filter((row) => {
      try {
        return normalizeDomainEvent(row).projectId === projectId;
      } catch {
        return false;
      }
    });
    if (covered.length)
      await this.prisma.liveModelEventDelivery.createMany({
        data: covered.map((row) => ({
          eventId: row.id,
          projectId,
          handlerKey: "live-model.rebuild.v1",
          eventSchemaVersion: row.schemaVersion,
          projectStructuralVersion: build.projectStructuralVersion,
          outputDigest: persisted.digest,
        })),
        skipDuplicates: true,
      });
    return { build, persisted };
  }

  async suppressWarning(
    actor: SessionActor,
    projectId: string,
    warningId: string,
    suppressed: boolean,
  ): Promise<void> {
    const warning = await this.prisma.liveModelWarning.findFirst({
      where: {
        id: warningId,
        projectId,
        project: { workspaceId: actor.workspaceId, status: "ACTIVE" },
        resolvedAt: null,
      },
      select: { warningType: true },
    });
    if (!warning) throw errors.notFound();
    if (
      suppressed &&
      !isWarningSuppressible(warning.warningType as LiveModelWarningType)
    )
      throw errors.validation(
        "This data-integrity warning cannot be suppressed.",
      );
    await this.prisma.liveModelWarning.update({
      where: { id: warningId },
      data: {
        suppressedAt: suppressed ? new Date() : null,
        suppressedById: suppressed ? actor.userId : null,
      },
    });
  }
}
