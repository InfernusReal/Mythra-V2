import { SuggestionService } from "@/domains/suggestions/application/service";
import { PrismaSuggestionRepository } from "@/domains/suggestions/infrastructure/prisma-suggestion-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function suggestionService(): SuggestionService {
  return new SuggestionService(new PrismaSuggestionRepository(getPrisma()), logger.child({ module: "suggestions" }));
}
