import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.volumes.create", 201, async (actor, requestId) => structureService().createVolume(actor, (await params).id, await request.json(), requestId));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.volumes.update", 200, async (actor, requestId) => structureService().updateVolume(actor, (await params).id, await request.json(), requestId));
}

