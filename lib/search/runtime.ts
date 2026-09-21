import { SearchService } from "@/domains/search/application/service";
import { SearchProviderRegistry } from "@/domains/search/domain/provider-registry";
import { PrismaSearchRepository } from "@/domains/search/infrastructure/prisma-search-repository";
import { causalityService } from "@/lib/causality/runtime";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { PrismaOperationsRepository } from "@/domains/operations/infrastructure/prisma-operations-repository";

export function searchService(): SearchService {
  const repository = new PrismaSearchRepository(getPrisma());
  const providers = new SearchProviderRegistry();
  providers.register(repository);
  return new SearchService(repository, providers, causalityService(), logger.child({ module: "search" }), new PrismaOperationsRepository(getPrisma()));
}
