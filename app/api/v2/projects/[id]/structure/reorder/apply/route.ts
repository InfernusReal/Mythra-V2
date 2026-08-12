import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.reorder.apply", 200, async (actor, requestId) => structureService().applyVolumeReorder(actor, (await params).id, await request.json(), requestId));
}

