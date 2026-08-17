import { universeHttp } from "@/lib/universe/http";
import { universeService } from "@/lib/universe/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; entityId: string }> }) { const { id, entityId } = await params; return universeHttp(request, "universe.entity.snapshots.create", async (actor, requestId) => universeService().createSnapshot(actor, id, entityId, await request.json(), requestId), 201); }
