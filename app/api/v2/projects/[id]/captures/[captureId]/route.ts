import { captureHttp } from "@/lib/capture/http";
import { captureService } from "@/lib/capture/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; captureId: string }> }) { const { id, captureId } = await params; return captureHttp(request, "captures.detail", (actor, requestId) => captureService().get(actor, id, captureId, requestId)); }
