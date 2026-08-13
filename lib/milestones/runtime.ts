import { MilestoneService } from "@/domains/milestones/application/service";
import { PrismaMilestoneRepository } from "@/domains/milestones/infrastructure/prisma-milestone-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function milestoneService(): MilestoneService {
  return new MilestoneService(new PrismaMilestoneRepository(getPrisma()), logger.child({ module: "milestones" }));
}
