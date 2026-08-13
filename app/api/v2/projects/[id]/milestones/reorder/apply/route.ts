import { milestoneApi } from "@/lib/milestones/http";
import { milestoneService } from "@/lib/milestones/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.reorder.apply", 200, async (actor, requestId) => milestoneService().applyReorder(actor, (await params).id, await request.json(), requestId));
}
