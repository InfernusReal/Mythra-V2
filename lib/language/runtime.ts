import { LanguageService } from "@/domains/language/application/service";
import { PrismaVocabularyRepository } from "@/domains/language/infrastructure/prisma-vocabulary-repository";
import { WordNetDictionaryProvider } from "@/domains/language/infrastructure/wordnet-dictionary-provider";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

let dictionary: WordNetDictionaryProvider | undefined;

export function languageService(): LanguageService {
  dictionary ??= new WordNetDictionaryProvider();
  return new LanguageService(dictionary, new PrismaVocabularyRepository(getPrisma()), logger.child({ module: "language" }));
}
