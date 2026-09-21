import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const identities = new PrismaIdentityRepository(prisma);
    const suffix = randomUUID();
    const actorA = await identities.resolveOrProvision({
      provider: "s1",
      subject: `a-${suffix}`,
      email: `a-${suffix}@example.test`,
      emailVerified: true
    }, suffix);
    const actorB = await identities.resolveOrProvision({
      provider: "s1",
      subject: `b-${suffix}`,
      email: `b-${suffix}@example.test`,
      emailVerified: true
    }, suffix);
    const sessions = {
      a: { ...actorA, sessionId: randomUUID() },
      b: { ...actorB, sessionId: randomUUID() }
    };
    const writing = new PrismaWritingRepository(prisma);
    const project = await writing.createProject(sessions.a, { title: "Sensitive title not logged", description: "Optional description" });
    const first = await writing.createChapter(sessions.a, { projectId: project.id, title: "Chapter 1" });
    const placed = await writing.createChapter(sessions.a, { projectId: project.id, title: "Placed chapter", sequenceIndex: 5 });

    const firstReadModel = await writing.getEditor(sessions.a, first.chapter.id);
    if (!firstReadModel) throw new Error("Owner could not load editor.");
    if (firstReadModel.navigation.nextChapterId !== placed.chapter.id || firstReadModel.navigation.previousChapterId !== null) {
      throw new Error("Nearby-chapter navigation did not preserve ordered switching.");
    }
    if (await writing.getEditor(sessions.b, first.chapter.id)) throw new Error("Cross-workspace indirect chapter access succeeded.");
    await writing.createChapter(sessions.b, { projectId: project.id, title: "Denied" })
      .then(() => { throw new Error("Cross-workspace chapter creation succeeded."); })
      .catch((error: unknown) => {
        if (!(error instanceof Error) || error.message === "Cross-workspace chapter creation succeeded.") throw error;
      });

    const stored = await prisma.chapter.findUniqueOrThrow({ where: { id: first.chapter.id } });
    const activeProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
    if (stored.documentSchemaVersion !== 1 || stored.version !== 1 || stored.bodyText !== "" || stored.wordCount !== 0) {
      throw new Error("Chapter derived/version defaults differ from the canonical v1 contract.");
    }
    if (placed.chapter.sequenceIndex !== 5 || activeProject.activeChapterId !== placed.chapter.id) {
      throw new Error("Optional placement or active-chapter assignment failed.");
    }

    // Console trace S1-DB-001: Project/Chapter constraints, placement, active chapter, and indirect ownership guards passed without content emission.
    console.log(JSON.stringify({
      level: "info",
      step: "S1-DB-001",
      event: "editor_core_database.verified",
      projectId: project.id,
      chapterId: first.chapter.id,
      crossWorkspaceRead: false,
      crossWorkspaceWrite: false,
      loadedChapterCount: 1,
      documentSchemaVersion: stored.documentSchemaVersion,
      optionalPlacement: placed.chapter.sequenceIndex
    }));
  } finally {
    await prisma.$disconnect();
  }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260812170000_editor_core/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Project','Chapter')`
    );
    if (remaining.rows[0]?.count !== "0") throw new Error("Editor-core rollback left capability tables behind.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260812170000_editor_core'`);
    // Console trace S1-DB-002: reviewed Sub-gate 1 rollback removed only Project/Chapter capability structures.
    console.log(JSON.stringify({ level: "info", step: "S1-DB-002", event: "editor_core_database.rollback_verified", remainingTables: 0 }));
  } finally {
    await client.end();
  }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
