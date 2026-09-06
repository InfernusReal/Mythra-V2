import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaCaptureRepository } from "../domains/capture/infrastructure/prisma-capture-repository";
import { PrismaNoteRepository } from "../domains/notes/infrastructure/prisma-note-repository";
import { PrismaResearchRepository } from "../domains/research/infrastructure/prisma-research-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const suffix = randomUUID();
  const identity = await new PrismaIdentityRepository(prisma).resolveOrProvision({ provider: "s18-pagination", subject: suffix, email: `${suffix}@example.test`, emailVerified: true }, suffix);
  const actor = { ...identity, sessionId: randomUUID() };
  const project = await new PrismaWritingRepository(prisma).createProject(actor, { title: "S18 synthetic pagination" });
  const date = new Date("2026-09-05T00:00:00.000Z");
  const ids = Array.from({ length: 7 }, () => randomUUID()).sort().reverse();
  for (const id of ids) {
    await prisma.capture.create({ data: { id, userId: actor.userId, projectId: project.id, clientCaptureId: id, rawText: "Synthetic capture", route: "/app", capturedAt: date } });
    await prisma.note.create({ data: { id, createdById: actor.userId, projectId: project.id, title: "Synthetic note", body: "Synthetic note content", normalizedTags: ["fixture"], updatedAt: date } });
    await prisma.researchItem.create({ data: { id, createdById: actor.userId, projectId: project.id, title: "Synthetic research", kind: "NOTE", body: "Synthetic reference", updatedAt: date } });
  }
  const infectedAsset = await prisma.storedAsset.create({ data: { workspaceId: actor.workspaceId, projectId: project.id, createdById: actor.userId, storageKey: `s18/${suffix}`, displayName: "synthetic.txt", contentType: "text/plain", sizeBytes: 1, sha256: "a".repeat(64), scanStatus: "INFECTED" } });
  await prisma.researchItem.create({ data: { createdById: actor.userId, projectId: project.id, title: "Rejected synthetic file", kind: "FILE", assetId: infectedAsset.id, updatedAt: date } });
  const capture = new PrismaCaptureRepository(prisma); const note = new PrismaNoteRepository(prisma); const research = new PrismaResearchRepository(prisma);
  const readers = [
    async (cursor?: string) => { const page = await capture.list(actor, project.id, { cursor, limit: 3, dueOnly: false, lifecycle: "UNPROCESSED" }); return { rows: page.captures, nextCursor: page.nextCursor }; },
    async (cursor?: string) => { const page = await note.list(actor, project.id, { cursor, limit: 3, tag: "fixture" }); return { rows: page.notes, nextCursor: page.nextCursor }; },
    async (cursor?: string) => { const page = await research.list(actor, project.id, { cursor, limit: 3 }); return { rows: page.items, nextCursor: page.nextCursor }; },
  ];
  for (const read of readers) {
    const found: string[] = []; let cursor: string | undefined;
    for (let index = 0; index < 3; index++) {
      const page = await read(cursor); found.push(...page.rows.map((row) => row.id));
      assert.equal(page.rows.length, index === 2 ? 1 : 3);
      if (index < 2) assert.ok(page.nextCursor?.includes("|")); else assert.equal(page.nextCursor, null);
      cursor = page.nextCursor ?? undefined;
    }
    assert.deepEqual(found, ids); assert.equal(new Set(found).size, 7);
    assert.equal((await read(date.toISOString())).rows.length, 0);
  }
  assert.equal((await note.list(actor, project.id, { limit: 3, tag: "absent" })).notes.length, 0);
  assert.equal((await research.list(actor, project.id, { limit: 3, kind: "FILE" })).items.length, 0);
  assert.equal((await capture.list(actor, project.id, { limit: 3, dueOnly: true })).captures.length, 0);
  const outsider = { ...actor, workspaceId: randomUUID() };
  for (const read of [() => capture.list(outsider, project.id, { limit: 3, dueOnly: false }), () => note.list(outsider, project.id, { limit: 3 }), () => research.list(outsider, project.id, { limit: 3 })]) await assert.rejects(read, { code: "NOT_FOUND" });
  assert.equal((await capture.list({ ...actor, userId: randomUUID() }, project.id, { limit: 3, dueOnly: false })).captures.length, 0);
  // Console trace S18-DB-002: native keyset proof records bounded counts/outcomes, never authored records, cursor values, or connection data.
  console.log(JSON.stringify({ level: "info", step: "S18-DB-002", event: "lists.tied_timestamp_verified", projectId: project.id, domainCount: 3, rowsPerDomain: 7, pagesPerDomain: 3, duplicates: 0, omissions: 0, ownershipAndFiltersPreserved: true, infectedFileExcluded: true }));
} finally { await prisma.$disconnect(); }
