import { TimelineService } from "@/domains/timeline/application/service";
import { PrismaTimelineRepository } from "@/domains/timeline/infrastructure/prisma-timeline-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
export function timelineService() { return new TimelineService(new PrismaTimelineRepository(getPrisma()), logger.child({ module: "timeline" })); }
