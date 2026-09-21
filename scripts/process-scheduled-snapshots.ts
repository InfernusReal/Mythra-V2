import "dotenv/config";
import { getPrisma } from "@/lib/db/prisma";
import { portabilityService } from "@/lib/portability/runtime";

const prisma = getPrisma();
const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1_000);
const projects = await prisma.project.findMany({ where: { status: "ACTIVE", OR: [{ projectSnapshots: { none: { status: "VERIFIED" } } }, { projectSnapshots: { none: { status: "VERIFIED", verifiedAt: { gte: cutoff } } } }] }, orderBy: { id: "asc" }, take: 50, select: { id: true, workspace: { select: { ownerUserId: true } }, workspaceId: true } });
let completed = 0; let failed = 0;
for (const project of projects) {
  try { await portabilityService().createSnapshot({ userId: project.workspace.ownerUserId, workspaceId: project.workspaceId, role: "OWNER", sessionId: "scheduled-snapshot-worker" }, project.id, `scheduled:${new Date().toISOString().slice(0, 10)}`); completed += 1; } catch { failed += 1; }
}
// Console trace S16-OPS-010: scheduled snapshot job completion records bounded counts and stable job type only.
console.log(JSON.stringify({ level: failed ? "warn" : "info", step: "S16-OPS-010", event: "job.completed", jobType: "scheduled_snapshot", candidateCount: projects.length, completed, failed, status: failed ? "partial" : "completed" }));
// Console trace S16-OPS-011: scheduled backup signal records aggregate success/failure counts without project content.
console.log(JSON.stringify({ level: failed ? "error" : "info", step: "S16-OPS-011", event: "backup.status", status: failed ? "failed" : "verified", completed, failed }));
// Console trace S13-SNAPSHOT-003: scheduler exit reports bounded project and outcome counts only.
console.log(JSON.stringify({ level: "info", step: "S13-SNAPSHOT-003", event: "portability.snapshot_schedule_completed", candidateCount: projects.length, completed, failed }));
await prisma.$disconnect();
