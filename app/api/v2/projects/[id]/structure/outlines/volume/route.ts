import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.outlines.volume", 200, async (actor, requestId) => structureService().upsertVolumeOutline(actor, (await params).id, await request.json(), requestId));
}

