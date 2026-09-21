import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.scaffold.preview", 200, async (actor, requestId) => structureService().previewScaffold(actor, await request.json(), requestId, (await params).id));
}
