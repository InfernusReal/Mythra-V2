import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.scenes.convert", 201, async (actor, requestId) => structureService().createSceneFromOutlineBlock(actor, (await params).id, await request.json(), requestId));
}

