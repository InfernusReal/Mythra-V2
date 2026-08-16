import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { causalityService } from "@/lib/causality/runtime";
import { CaptureService } from "@/domains/capture/application/service";
import { PrismaCaptureRepository } from "@/domains/capture/infrastructure/prisma-capture-repository";

let singleton: CaptureService | null = null;
export function captureService(): CaptureService { singleton ??= new CaptureService(new PrismaCaptureRepository(getPrisma()), logger, causalityService()); return singleton; }
