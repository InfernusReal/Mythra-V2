import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.outlines.chapter", 200, async (actor, requestId) => structureService().upsertChapterOutline(actor, (await params).id, await request.json(), requestId));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.outlines.chapter.reparent", 200, async (actor, requestId) => structureService().reparentChapterOutline(actor, (await params).id, await request.json(), requestId));
}

