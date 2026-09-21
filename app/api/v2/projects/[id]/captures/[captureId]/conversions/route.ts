import { captureHttp } from "@/lib/capture/http";
import { captureService } from "@/lib/capture/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; captureId: string }> }) { const { id, captureId } = await params; return captureHttp(request, "captures.convert", async (actor, requestId) => captureService().convert(actor, id, captureId, await request.json(), requestId)); }
