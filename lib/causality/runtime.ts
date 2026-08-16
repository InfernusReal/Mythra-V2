import { CausalityService } from "@/domains/causality/application/service";
import { PrismaCausalityRepository } from "@/domains/causality/infrastructure/prisma-causality-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function causalityService(): CausalityService { return new CausalityService(new PrismaCausalityRepository(getPrisma()), logger.child({ module: "causality" })); }
