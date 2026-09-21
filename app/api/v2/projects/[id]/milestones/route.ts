import { milestoneApi } from "@/lib/milestones/http";
import { milestoneService } from "@/lib/milestones/runtime";
import { errors } from "@/lib/contracts/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.overview", 200, async (actor, requestId) => {
    const query = new URL(request.url).searchParams;
    const result = await milestoneService().getOverview(actor, (await params).id, { nodeBudget: query.get("nodeBudget") ?? undefined, edgeBudget: query.get("edgeBudget") ?? undefined }, requestId);
    if (!result) throw errors.notFound();
    return result;
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.write", 201, async (actor, requestId) => milestoneService().writeMilestone(actor, (await params).id, await request.json(), requestId));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return milestoneApi(request, "milestones.write", 200, async (actor, requestId) => milestoneService().writeMilestone(actor, (await params).id, await request.json(), requestId));
}
