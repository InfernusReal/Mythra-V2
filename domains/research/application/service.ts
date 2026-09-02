import { createHash, randomUUID } from "node:crypto";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { PrivateObjectStorage } from "@/lib/storage/object-storage";
import type { Logger } from "@/lib/observability/logger";
import { researchCreateSchema, researchLinkSchema, researchListSchema, validateResearchFile } from "../domain/types";
import type { MalwareScanner, ResearchRepository } from "./ports";
import type { AssetAccessTokenService } from "../infrastructure/signed-asset-access";
import { errors } from "@/lib/contracts/errors";
import { assertUploadSignature } from "@/lib/security/upload-policy";
import { recordOperationalEvent, type OperationalEventSink } from "@/lib/observability/operations";

export class ResearchService {
  constructor(
    private readonly repository: ResearchRepository,
    private readonly storage: PrivateObjectStorage,
    private readonly scanner: MalwareScanner,
    private readonly accessTokens: AssetAccessTokenService,
    private readonly logger: Logger,
    private readonly billing?: {
      authorizeCost(actor: SessionActor, resource: "binaryStorageBytes", requested: number, action: "HIGH_COST_WRITE"): Promise<unknown>;
      recordUsage(actor: SessionActor, input: { resource: "binaryStorageBytes" | "bandwidthBytes"; quantity: number; idempotencyKey: string; sourceType: string; sourceId?: string }): Promise<unknown>;
    },
    private readonly operations?: OperationalEventSink
  ) {}
  async list(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = researchListSchema.parse(raw); const result = await this.repository.list(actor, projectId, input);
    // Console trace S11-RESEARCH-001: bounded Research retrieval records kind/count metadata only and excludes authored research content, URLs, citations, and file names.
    this.logger.info("research.page_loaded", { step: "S11-RESEARCH-001", requestId, workspaceId: actor.workspaceId, projectId, hasKindFilter: Boolean(input.kind), returned: result.items.length, hasMore: Boolean(result.nextCursor) }); return result; }
  async create(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = researchCreateSchema.parse(raw); const result = await this.repository.create(actor, projectId, input);
    // Console trace S11-RESEARCH-002: Research mutation records kind/identity/version metadata only.
    this.logger.info("research.item_created", { step: "S11-RESEARCH-002", requestId, workspaceId: actor.workspaceId, projectId, sourceId: result.item.id, kind: result.item.kind, version: result.item.version, hasAsset: Boolean(result.item.asset) }); return result; }
  async link(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = researchLinkSchema.parse(raw); const result = await this.repository.link(actor, projectId, input);
    // Console trace S11-RESEARCH-003: explicit Research link logs endpoint identity only and excludes research/story content.
    this.logger.info("research.link_written", { step: "S11-RESEARCH-003", requestId, workspaceId: actor.workspaceId, projectId, sourceId: input.researchItemId, targetType: input.targetType, targetId: input.targetId, replayed: result.replayed }); return result; }
  async upload(actor: SessionActor, projectId: string, file: { name: string; type: string; bytes: Uint8Array }, requestId: string) { let valid: ReturnType<typeof validateResearchFile>; try { valid = validateResearchFile({ displayName: file.name, contentType: file.type, sizeBytes: file.bytes.byteLength }); assertUploadSignature(valid.contentType, file.bytes); } catch (caught) { throw errors.validation(caught instanceof Error ? caught.message : "Research file validation failed."); } await this.billing?.authorizeCost(actor, "binaryStorageBytes", valid.sizeBytes, "HIGH_COST_WRITE"); const sha256 = createHash("sha256").update(file.bytes).digest("hex"); const storageKey = `${actor.workspaceId}/${projectId}/${randomUUID()}`; const reserved = await this.repository.reserveAsset(actor, projectId, { storageKey, displayName: valid.displayName, contentType: valid.contentType, sizeBytes: valid.sizeBytes, sha256 }); if (!reserved.replayed) { try { await this.storage.putPrivate({ key: storageKey, bytes: file.bytes, contentType: valid.contentType }); } catch { await this.recordStorageFailure(actor, projectId, reserved.assetId, "PRIVATE_WRITE_FAILED"); throw errors.dependencyUnavailable(); } let outcome: { status: "CLEAN" | "INFECTED" | "ERROR"; reasonCode: string }; try { outcome = await this.scanner.scan({ bytes: file.bytes, contentType: valid.contentType, sha256 }); } catch { outcome = { status: "ERROR", reasonCode: "SCANNER_UNAVAILABLE" }; } await this.repository.completeAsset(actor, projectId, reserved.assetId, outcome); if (outcome.status !== "CLEAN") { await this.storage.deletePrivate(storageKey); if (outcome.status === "ERROR") await this.recordStorageFailure(actor, projectId, reserved.assetId, outcome.reasonCode); } else await this.recordUsageSafe(actor, { resource: "binaryStorageBytes", quantity: valid.sizeBytes, idempotencyKey: `asset:${reserved.assetId}`, sourceType: "StoredAsset", sourceId: reserved.assetId });
      // Console trace S16-UPLOAD-001: signature and scanner enforcement records only MIME, byte count, stable identity, and scan outcome.
      this.logger.info("security.upload_processed", { step: "S16-UPLOAD-001", requestId, workspaceId: actor.workspaceId, projectId, sourceId: reserved.assetId, mimeType: valid.contentType, sizeBytes: valid.sizeBytes, scanStatus: outcome.status, reasonCode: outcome.reasonCode }); }
    // Console trace S11-STORAGE-001: private upload/scan records hashes only as opaque identity, byte count, MIME and outcome; file name/content are excluded.
    this.logger.info("research.asset_processed", { step: "S11-STORAGE-001", requestId, workspaceId: actor.workspaceId, projectId, sourceId: reserved.assetId, mimeType: valid.contentType, sizeBytes: valid.sizeBytes, replayed: reserved.replayed }); return reserved; }
  async issueAssetAccess(actor: SessionActor, projectId: string, assetId: string, requestId: string) { await this.repository.authorizeAsset(actor, projectId, assetId); const token = this.accessTokens.issue(actor, projectId, assetId);
    // Console trace S11-STORAGE-002: signed access issuance logs resource identity and expiry only; token, storage key, name and content are excluded.
    this.logger.info("research.asset_access_issued", { step: "S11-STORAGE-002", requestId, workspaceId: actor.workspaceId, projectId, sourceId: assetId, expiresInSeconds: 300 }); return { href: `/api/v2/projects/${projectId}/research/assets/${assetId}?access=${encodeURIComponent(token)}`, expiresInSeconds: 300 }; }
  async download(actor: SessionActor, projectId: string, assetId: string, token: string, requestId: string) { this.accessTokens.verify(token, actor, projectId, assetId); const asset = await this.repository.authorizeAsset(actor, projectId, assetId); let bytes: Uint8Array; try { bytes = await this.storage.getPrivate(asset.storageKey); } catch { await this.recordStorageFailure(actor, projectId, assetId, "PRIVATE_READ_FAILED"); throw errors.dependencyUnavailable(); } await this.recordUsageSafe(actor, { resource: "bandwidthBytes", quantity: bytes.byteLength, idempotencyKey: `asset-download:${assetId}:${randomUUID()}`, sourceType: "AssetDownload", sourceId: assetId });
    // Console trace S11-STORAGE-003: signed private download logs identity/byte count only and excludes token, key, name and content.
    this.logger.info("research.asset_downloaded", { step: "S11-STORAGE-003", requestId, workspaceId: actor.workspaceId, projectId, sourceId: assetId, sizeBytes: bytes.byteLength }); return { ...asset, bytes }; }

  private async recordStorageFailure(actor: SessionActor, projectId: string, assetId: string, errorCode: string): Promise<void> {
    if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, projectId, eventName: "storage.failure", numericValue: 1, dimensions: { status: "failed", errorCode, resource: "research_asset" } }).catch(() => undefined);
    // Console trace S16-OPS-007: private-storage failure records only actor/project/asset identity and stable error code.
    this.logger.error("storage.failure", { step: "S16-OPS-007", workspaceId: actor.workspaceId, projectId, sourceId: assetId, status: "failed", errorCode, resource: "research_asset" });
  }

  private async recordUsageSafe(actor: SessionActor, input: { resource: "binaryStorageBytes" | "bandwidthBytes"; quantity: number; idempotencyKey: string; sourceType: string; sourceId?: string }): Promise<void> {
    if (!this.billing) return;
    try {
      await this.billing.recordUsage(actor, input);
      // Console trace S14-METER-003: research storage accounting records cost dimensions without file names, keys or bytes.
      this.logger.info("research.cost_accounted", { step: "S14-METER-003", workspaceId: actor.workspaceId, resource: input.resource, quantity: input.quantity, sourceType: input.sourceType, sourceId: input.sourceId ?? null });
    } catch {
      // Console trace S14-METER-004: accounting failure never withholds a clean owned asset or authorized download.
      this.logger.warn("research.cost_accounting_failed", { step: "S14-METER-004", workspaceId: actor.workspaceId, resource: input.resource, quantity: input.quantity, sourceType: input.sourceType, sourceId: input.sourceId ?? null, errorCode: "USAGE_ACCOUNTING_UNAVAILABLE" });
    }
  }
}
