import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { Client } from "pg";

const source = process.env.DATABASE_URL;
if (!source) throw new Error("DATABASE_URL is required.");
const sourceDatabaseUrl = new URL(source);
sourceDatabaseUrl.searchParams.delete("schema");
const restoreAdminUrl = new URL(process.env.RESTORE_ADMIN_URL ?? source);
const restoreDatabase = `mythra_s16_restore_${randomUUID().replaceAll("-", "")}`;
if (!/^mythra_s16_restore_[a-f0-9]{32}$/u.test(restoreDatabase)) throw new Error("Unsafe restore database identifier.");
restoreAdminUrl.searchParams.delete("schema");
const restoreUrl = new URL(restoreAdminUrl); restoreUrl.pathname = `/${restoreDatabase}`;
const temporary = await mkdtemp(path.join(tmpdir(), "mythra-s16-backup-"));
const archive = path.join(temporary, "database.dump");
const admin = new Client({ connectionString: restoreAdminUrl.toString() });

function run(binary: string, args: string[]): void {
  const result = spawnSync(binary, args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) {
    const diagnostic = `${result.stderr ?? result.stdout ?? ""}`.trim().slice(0, 500);
    throw new Error(`${path.basename(binary)} failed with code ${result.status ?? "unknown"}${diagnostic ? `: ${diagnostic}` : "."}`);
  }
}

function postgresBinary(name: "pg_dump" | "pg_restore"): string {
  const configured = process.env.POSTGRES_BIN ? path.join(process.env.POSTGRES_BIN, `${name}${process.platform === "win32" ? ".exe" : ""}`) : null;
  const windows = process.platform === "win32" ? [`C:/Program Files/PostgreSQL/18/bin/${name}.exe`, `C:/Program Files/PostgreSQL/17/bin/${name}.exe`, `C:/Program Files/PostgreSQL/16/bin/${name}.exe`] : [];
  return [configured, ...windows].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate))) ?? name;
}

async function fingerprint(connectionString: string) {
  const client = new Client({ connectionString }); await client.connect();
  try {
    const result = await client.query<{ table_count: string; migration_count: string; workspace_count: string; project_count: string; chapter_count: string; audit_count: string }>(`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public')::text AS table_count, (SELECT COUNT(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL)::text AS migration_count, (SELECT COUNT(*) FROM "Workspace")::text AS workspace_count, (SELECT COUNT(*) FROM "Project")::text AS project_count, (SELECT COUNT(*) FROM "Chapter")::text AS chapter_count, (SELECT COUNT(*) FROM "AuditEvent")::text AS audit_count`);
    return result.rows[0]!;
  } finally { await client.end(); }
}

await admin.connect();
try {
  const before = await fingerprint(sourceDatabaseUrl.toString());
  run(postgresBinary("pg_dump"), ["--format=custom", "--no-owner", "--no-acl", `--file=${archive}`, `--dbname=${sourceDatabaseUrl.toString()}`]);
  await admin.query(`CREATE DATABASE "${restoreDatabase}" TEMPLATE template0`);
  run(postgresBinary("pg_restore"), ["--no-owner", "--no-acl", "--exit-on-error", `--dbname=${restoreUrl.toString()}`, archive]);
  const restored = await fingerprint(restoreUrl.toString());
  if (JSON.stringify(before) !== JSON.stringify(restored)) throw new Error("Restored database fingerprint differs from source.");
  // Console trace S16-BACKUP-001: backup/restore drill reports only isolated database identity and aggregate fingerprints.
  console.log(JSON.stringify({ level: "info", step: "S16-BACKUP-001", event: "backup.status", status: "verified", restoreDatabase, tableCount: Number(restored.table_count), migrationCount: Number(restored.migration_count), workspaceCount: Number(restored.workspace_count), projectCount: Number(restored.project_count), chapterCount: Number(restored.chapter_count), auditCount: Number(restored.audit_count) }));
} catch (caught) {
  // Console trace S16-BACKUP-002: backup/restore drill failure reports a fixed error code without database content or command output.
  console.log(JSON.stringify({ level: "error", step: "S16-BACKUP-002", event: "backup.status", status: "failed", errorCode: "BACKUP_RESTORE_DRILL_FAILED" }));
  throw caught;
} finally {
  await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [restoreDatabase]).catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS "${restoreDatabase}"`).catch(() => undefined);
  await admin.end().catch(() => undefined);
  await rm(temporary, { recursive: true, force: true });
}
