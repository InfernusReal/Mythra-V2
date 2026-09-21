import "dotenv/config";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function verify(): Promise<void> {
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const suffix = randomUUID();
  try {
    const repository = new PrismaIdentityRepository(prisma);
    const first = await repository.resolveOrProvision({
      provider: "foundation-verifier",
      subject: `author-a-${suffix}`,
      email: `author-a-${suffix}@example.test`,
      displayName: "Foundation Verifier A",
      emailVerified: true
    }, `verify-a-${suffix}`);
    const second = await repository.resolveOrProvision({
      provider: "foundation-verifier",
      subject: `author-b-${suffix}`,
      email: `author-b-${suffix}@example.test`,
      displayName: "Foundation Verifier B",
      emailVerified: true
    }, `verify-b-${suffix}`);
    const repeated = await repository.resolveOrProvision({
      provider: "foundation-verifier",
      subject: `author-a-${suffix}`,
      email: `author-a-${suffix}@example.test`,
      displayName: "Foundation Verifier A",
      emailVerified: true
    }, `verify-a-repeat-${suffix}`);
    if (!first.createdWorkspace || !second.createdWorkspace || repeated.createdWorkspace) {
      throw new Error("First-use workspace provisioning is not idempotent.");
    }
    if (repeated.userId !== first.userId || repeated.workspaceId !== first.workspaceId) {
      throw new Error("Repeated identity resolution changed canonical ownership.");
    }
    const owned = await repository.findActor(first.userId, first.workspaceId, randomUUID());
    const crossWorkspace = await repository.findActor(first.userId, second.workspaceId, randomUUID());
    if (!owned || crossWorkspace) throw new Error("Workspace membership guard failed.");
    const auditCount = await prisma.auditEvent.count({ where: { workspaceId: first.workspaceId } });
    if (auditCount !== 1) throw new Error(`Expected one first-use audit event, received ${auditCount}.`);
    const concurrentPrincipal = {
      provider: "foundation-verifier",
      subject: `parallel-${suffix}`,
      email: `parallel-${suffix}@example.test`,
      displayName: "Parallel Foundation Verifier",
      emailVerified: true
    };
    const concurrent = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        repository.resolveOrProvision(concurrentPrincipal, `verify-parallel-${index}-${suffix}`)
      )
    );
    if (new Set(concurrent.map((record) => record.userId)).size !== 1 || new Set(concurrent.map((record) => record.workspaceId)).size !== 1) {
      throw new Error("Concurrent first-use provisioning produced duplicate ownership records.");
    }
    // Console trace S0-DB-001: real PostgreSQL constraints, idempotent identity, and cross-workspace guard passed.
    console.log(JSON.stringify({
      level: "info",
      step: "S0-DB-001",
      event: "foundation_database.verified",
      workspaceCount: 3,
      auditCount,
      concurrentAttempts: 8,
      crossWorkspaceAccess: false
    }));
  } finally {
    await prisma.$disconnect();
  }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260812090000_foundation/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('User','Workspace','WorkspaceMember','ExternalIdentity','UserPreference','AuditEvent','OutboxEvent')`
    );
    if (remaining.rows[0]?.count !== "0") throw new Error("Foundation rollback left application tables behind.");
    await client.query(`DROP TABLE IF EXISTS "_prisma_migrations"`);
    // Console trace S0-DB-002: reviewed Sub-gate 0 rollback removed only foundation structures.
    console.log(JSON.stringify({ level: "info", step: "S0-DB-002", event: "foundation_database.rollback_verified", remainingTables: 0 }));
  } finally {
    await client.end();
  }
}

const command = process.argv[2];
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
