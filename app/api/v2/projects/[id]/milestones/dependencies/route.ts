import { milestoneApi } from "@/lib/milestones/http";
import { milestoneService } from "@/lib/milestones/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.dependencies.write", 201, async (actor, requestId) => milestoneService().writeDependency(actor, (await params).id, await request.json(), requestId));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.dependencies.write", 200, async (actor, requestId) => milestoneService().writeDependency(actor, (await params).id, await request.json(), requestId));
}
