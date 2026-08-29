import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { researchService } from "@/lib/research/runtime";
export async function GET(request: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const { id, assetId } = await params;
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const token = new URL(request.url).searchParams.get("access");
    if (!token) throw errors.forbidden();
    const asset = await researchService().download(actor as SessionActor, id, assetId, token, requestId);
    const body = asset.bytes.slice().buffer as ArrayBuffer;
    return new Response(body, { headers: { "content-type": asset.contentType, "content-length": String(asset.sizeBytes), "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.displayName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (caught) {
    const error = asAppError(caught);
    return Response.json(failure(error.code, error.message, requestId), { status: error.status });
  }
}
