import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.chapters.membership", 200, async (actor, requestId) => structureService().assignChapterToVolume(actor, (await params).id, await request.json(), requestId));
}

