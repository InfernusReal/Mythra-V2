import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.reorder.preview", 200, async (actor, requestId) => structureService().previewVolumeReorder(actor, await request.json(), requestId, (await params).id));
}
