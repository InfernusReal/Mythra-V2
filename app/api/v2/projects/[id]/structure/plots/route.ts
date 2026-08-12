import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.plots.create", 201, async (actor, requestId) => structureService().createPlot(actor, (await params).id, await request.json(), requestId));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.plots.update", 200, async (actor, requestId) => structureService().updatePlot(actor, (await params).id, await request.json(), requestId));
}

