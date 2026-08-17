import { universeHttp } from "@/lib/universe/http";
import { universeService } from "@/lib/universe/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; entityId: string }> }) { const { id, entityId } = await params; return universeHttp(request, "universe.entity.detail", (actor, requestId) => universeService().detail(actor, id, entityId, requestId)); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; entityId: string }> }) { const { id, entityId } = await params; return universeHttp(request, "universe.entity.update", async (actor, requestId) => universeService().update(actor, id, entityId, await request.json(), requestId)); }
