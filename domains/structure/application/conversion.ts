import { errors } from "@/lib/contracts/errors";

export type FutureConversionSource = "NOTE" | "CAPTURE";

export interface FutureStructureConversionRequest {
  sourceType: FutureConversionSource;
  sourceId: string;
  projectId: string;
}

export interface FutureStructureConversionPort {
  convert(request: FutureStructureConversionRequest): Promise<never>;
}

export class DormantFutureStructureConversion implements FutureStructureConversionPort {
  async convert(request: FutureStructureConversionRequest): Promise<never> {
    void request;
    throw errors.dependencyUnavailable();
  }
}
