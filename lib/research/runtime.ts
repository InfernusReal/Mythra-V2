import path from "node:path";
import { ResearchService } from "@/domains/research/application/service";
import { DeterministicMalwareScanner, FilesystemPrivateObjectStorage, HttpMalwareScanner } from "@/domains/research/infrastructure/local-storage";
import { PrismaResearchRepository } from "@/domains/research/infrastructure/prisma-research-repository";
import { HmacAssetAccessTokenService } from "@/domains/research/infrastructure/signed-asset-access";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { errors } from "@/lib/contracts/errors";
export function researchService() { const env = getEnv(); const root = env.MYTHRA_PRIVATE_STORAGE_ROOT ?? (env.NODE_ENV === "production" ? null : path.join(process.cwd(), ".mythra-private-storage")); if (!root) throw errors.dependencyUnavailable(); const scanner = env.MYTHRA_SCANNER_URL ? new HttpMalwareScanner(env.MYTHRA_SCANNER_URL) : env.NODE_ENV === "production" ? null : new DeterministicMalwareScanner(); if (!scanner) throw errors.dependencyUnavailable(); return new ResearchService(new PrismaResearchRepository(getPrisma()), new FilesystemPrivateObjectStorage(root), scanner, new HmacAssetAccessTokenService(env.SESSION_SECRET), logger.child({ module: "research" })); }
