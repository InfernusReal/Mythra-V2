import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaProjectArchiveReader } from "../domains/portability/infrastructure/prisma-project-archive-reader";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const writer = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const suffix = randomUUID();
  const identity = await new PrismaIdentityRepository(prisma).resolveOrProvision({ provider: "s18-verifier", subject: suffix, email: `${suffix}@example.test`, emailVerified: true }, suffix);
  const actor = { ...identity, sessionId: randomUUID() };
  const writing = new PrismaWritingRepository(prisma);
  const project = await writing.createProject(actor, { title: "S18 synthetic archive consistency" });
  const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Synthetic chapter" })).chapter;
  const before = await prisma.project.findUniqueOrThrow({ where: { id: project.id }, select: { structuralVersion: true } });
  const beforeChapter = await prisma.chapter.findUniqueOrThrow({ where: { id: chapter.id }, select: { version: true } });
  let resume!: () => void;
  let started!: () => void;
  const snapshotStarted = new Promise<void>((resolve) => { started = resolve; });
  const writerCommitted = new Promise<void>((resolve) => { resume = resolve; });
  const concurrentReader = prisma.$extends({ query: { project: { async findFirst({ args, query }) {
    const result = await query(args);
    started();
    await writerCommitted;
    return result;
  } } } });
  const read = new PrismaProjectArchiveReader(concurrentReader as unknown as PrismaClient).build(actor, project.id, new Date());
  await snapshotStarted;
  try {
    await writer.$transaction([
      writer.project.update({ where: { id: project.id }, data: { structuralVersion: { increment: 1 } } }),
      writer.chapter.update({ where: { id: chapter.id }, data: { version: { increment: 1 }, bodyText: "Synthetic concurrent change" } }),
    ]);
  } finally { resume(); }
  const snapshot = await read;
  assert.equal(snapshot.project.structuralVersion, before.structuralVersion);
  assert.equal(snapshot.collections.chapters[0]!.version, beforeChapter.version);
  assert.notEqual(snapshot.collections.chapters[0]!.bodyText, "Synthetic concurrent change");
  const later = await new PrismaProjectArchiveReader(prisma).build(actor, project.id, new Date());
  assert.equal(later.project.structuralVersion, before.structuralVersion + 1);
  assert.equal(later.collections.chapters[0]!.version, beforeChapter.version + 1);
  assert.equal(later.collections.chapters[0]!.bodyText, "Synthetic concurrent change");
  const database = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
  assert.match(database[0]!.version, /PostgreSQL 18/u);
  // Console trace S18-DB-001: native concurrent-writer proof emits versions and outcome, never archive content or connection credentials.
  console.log(JSON.stringify({ level: "info", step: "S18-DB-001", event: "archive.concurrent_snapshot_verified", projectId: project.id, beforeVersion: before.structuralVersion, laterVersion: later.project.structuralVersion, concurrentWriterCommitted: true, consistentSnapshot: true, nativePostgresMajor: 18 }));
} finally { await prisma.$disconnect(); await writer.$disconnect(); }
