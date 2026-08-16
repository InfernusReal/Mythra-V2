import { captureHttp } from "@/lib/capture/http";
import { captureService } from "@/lib/capture/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const query = Object.fromEntries(new URL(request.url).searchParams); return captureHttp(request, "captures.list", (actor, requestId) => captureService().list(actor, id, query, requestId)); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return captureHttp(request, "captures.lifecycle", async (actor, requestId) => captureService().lifecycle(actor, id, await request.json(), requestId)); }
