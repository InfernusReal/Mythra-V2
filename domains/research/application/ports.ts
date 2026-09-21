import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ResearchItemReadModel } from "../domain/types";
export interface MalwareScanner { scan(input: { bytes: Uint8Array; contentType: string; sha256: string }): Promise<{ status: "CLEAN" | "INFECTED" | "ERROR"; reasonCode: string }> }
export interface ResearchRepository {
  list(actor: SessionActor, projectId: string, query: { kind?: string; cursor?: string; limit: number }): Promise<{ items: ResearchItemReadModel[]; nextCursor: string | null }>;
  create(actor: SessionActor, projectId: string, input: Record<string, unknown>): Promise<{ item: ResearchItemReadModel }>;
  link(actor: SessionActor, projectId: string, input: { researchItemId: string; targetType: string; targetId: string; label?: string }): Promise<{ linkId: string; replayed: boolean }>;
  reserveAsset(actor: SessionActor, projectId: string, input: { storageKey: string; displayName: string; contentType: string; sizeBytes: number; sha256: string }): Promise<{ assetId: string; replayed: boolean }>;
  completeAsset(actor: SessionActor, projectId: string, assetId: string, outcome: { status: "CLEAN" | "INFECTED" | "ERROR"; reasonCode: string }): Promise<void>;
  authorizeAsset(actor: SessionActor, projectId: string, assetId: string): Promise<{ storageKey: string; contentType: string; displayName: string; sizeBytes: number }>;
}
