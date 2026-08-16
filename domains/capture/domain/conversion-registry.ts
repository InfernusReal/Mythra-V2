import { errors } from "@/lib/contracts/errors";
import { activeCaptureConversionTypes, reservedCaptureConversionTypes, type ActiveCaptureConversionType } from "./types";

export interface CaptureConversionAdapter { type: ActiveCaptureConversionType; }

export class CaptureConversionRegistry {
  private readonly active = new Map<ActiveCaptureConversionType, CaptureConversionAdapter>();
  constructor(adapters: readonly CaptureConversionAdapter[]) { for (const adapter of adapters) { if (this.active.has(adapter.type)) throw new Error(`Duplicate Capture conversion adapter: ${adapter.type}`); this.active.set(adapter.type, adapter); } }
  activeTypes(): ActiveCaptureConversionType[] { return activeCaptureConversionTypes.filter((type) => this.active.has(type)); }
  ensureActive(type: string): ActiveCaptureConversionType { if (reservedCaptureConversionTypes.includes(type as never) || !this.active.has(type as ActiveCaptureConversionType)) throw errors.dependencyUnavailable(); return type as ActiveCaptureConversionType; }
}

export const captureConversionRegistry = new CaptureConversionRegistry(activeCaptureConversionTypes.map((type) => ({ type })));
