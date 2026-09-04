import { AgentToolService } from "@/domains/tools/application/service";
import { PrismaAgentToolAuditRepository } from "@/domains/tools/infrastructure/prisma-tool-audit-repository";
import { PrismaAgentToolReadModel } from "@/domains/tools/infrastructure/prisma-tool-read-model";
import { captureService } from "@/lib/capture/runtime";
import { causalityService } from "@/lib/causality/runtime";
import { getPrisma } from "@/lib/db/prisma";
import { noteService } from "@/lib/notes/runtime";
import { logger } from "@/lib/observability/logger";
import { searchService } from "@/lib/search/runtime";
import { suggestionService } from "@/lib/suggestions/runtime";
import { universeService } from "@/lib/universe/runtime";

export function agentToolService(): AgentToolService {
  const prisma = getPrisma();
  return new AgentToolService({
    readModel: new PrismaAgentToolReadModel(prisma),
    search: searchService(),
    universe: universeService(),
    causality: causalityService(),
    notes: noteService(),
    captures: captureService(),
    suggestions: suggestionService(),
    audit: new PrismaAgentToolAuditRepository(prisma),
    logger: logger.child({ module: "agent-tools" }),
  });
}
