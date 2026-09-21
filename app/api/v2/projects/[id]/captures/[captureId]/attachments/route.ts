import { captureHttp } from "@/lib/capture/http";
import { captureService } from "@/lib/capture/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; captureId: string }> }) { const { id, captureId } = await params; return captureHttp(request, "captures.attach", async (actor, requestId) => captureService().attach(actor, id, captureId, await request.json(), requestId)); }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; captureId: string }> }) { const { id, captureId } = await params; const attachmentId = new URL(request.url).searchParams.get("attachmentId"); return captureHttp(request, "captures.detach", (actor, requestId) => captureService().detach(actor, id, captureId, attachmentId ?? "", requestId)); }
