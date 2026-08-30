import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { liveModelService } from "@/lib/live-model/runtime";
import { logger } from "@/lib/observability/logger";

const projectId = process.argv[2];
const userId = process.argv[3];
if (!projectId || !userId || !/^[0-9a-f-]{36}$/iu.test(projectId) || !/^[0-9a-f-]{36}$/iu.test(userId)) throw new Error("Usage: npm run repair:live-model -- <project-uuid> <member-user-uuid>");
const prisma = getPrisma();
try {
  const member = await prisma.workspaceMember.findFirst({ where: { userId, status: "ACTIVE", workspace: { projects: { some: { id: projectId, status: "ACTIVE" } } } }, select: { workspaceId: true, role: true } });
  if (!member) throw new Error("PROJECT_MEMBER_NOT_FOUND");
  const result = await liveModelService().rebuild({ userId, workspaceId: member.workspaceId, role: member.role, sessionId: "live-model-repair-cli" }, projectId, randomUUID());
  // Console trace S12-REPAIR-003: repair CLI exit exposes only identifiers, versions, counts, and digest.
  logger.info("live_model.rebuild_cli_completed", { step: "S12-REPAIR-003", projectId, userId, structuralVersion: result.projectStructuralVersion, projectionCount: result.projectionCount, warningCount: result.warningCount, staleRejected: result.staleRejected, outputDigest: result.digest });
} finally {
  await prisma.$disconnect();
}
