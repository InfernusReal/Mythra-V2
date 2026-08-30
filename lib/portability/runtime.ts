import path from "node:path";
import { PortabilityService } from "@/domains/portability/application/service";
import { PrismaPortabilityRepository } from "@/domains/portability/infrastructure/prisma-portability-repository";
import { PrismaProjectArchiveReader } from "@/domains/portability/infrastructure/prisma-project-archive-reader";
import { HmacArtifactAccessTokenService } from "@/domains/portability/infrastructure/signed-artifact-access";
import { FilesystemPrivateObjectStorage } from "@/domains/research/infrastructure/local-storage";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { errors } from "@/lib/contracts/errors";
import { logger } from "@/lib/observability/logger";

function storage() { const env = getEnv(); const root = env.MYTHRA_PRIVATE_STORAGE_ROOT ?? (env.NODE_ENV === "production" ? null : path.join(process.cwd(), ".mythra-private-storage")); if (!root) throw errors.dependencyUnavailable(); return new FilesystemPrivateObjectStorage(root); }
export function portabilityRepository() { return new PrismaPortabilityRepository(getPrisma()); }
export function portabilityService() { const prisma = getPrisma(); const reader = new PrismaProjectArchiveReader(prisma); return new PortabilityService({ repository: new PrismaPortabilityRepository(prisma), storage: storage(), buildArchive: (actor, projectId, generatedAt) => reader.build(actor, projectId, generatedAt), now: () => new Date() }, logger.child({ module: "portability" })); }
export function artifactTokens() { return new HmacArtifactAccessTokenService(getEnv().SESSION_SECRET); }
