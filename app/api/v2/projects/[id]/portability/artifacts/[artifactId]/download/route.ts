import { optionalActor } from "@/lib/auth/runtime";
import { errors, asAppError } from "@/lib/contracts/errors";
import { artifactTokens, portabilityService } from "@/lib/portability/runtime";
import { logger } from "@/lib/observability/logger";
export async function GET(request: Request, { params }: { params: Promise<{ id: string; artifactId: string }> }) {
  const { id, artifactId } = await params;
  try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); const token = new URL(request.url).searchParams.get("token") ?? ""; artifactTokens().verify(token, actor, id, artifactId); const bytes = await portabilityService().artifactBytes(actor, id, artifactId); // Console trace S13-API-004: signed artifact download logs only identity, byte count and successful authorization.
    logger.info("portability.download_authorized", { step: "S13-API-004", projectId: id, artifactId, sizeBytes: bytes.byteLength }); return new Response(bytes.slice().buffer as ArrayBuffer, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="mythra-${artifactId}.bin"`, "cache-control": "private, no-store" } }); }
  catch (caught) { const error = asAppError(caught); return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status }); }
}
