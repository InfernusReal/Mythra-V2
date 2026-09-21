import { errors } from "@/lib/contracts/errors";
import { structureApi } from "@/lib/structure/http";
import { structureService } from "@/lib/structure/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return structureApi(request, "structure.overview", 200, async (actor, requestId) => {
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    const result = await structureService().getOverview(actor, id, { pageSize: query.get("pageSize") ?? undefined, nodeBudget: query.get("nodeBudget") ?? undefined, edgeBudget: query.get("edgeBudget") ?? undefined, rangeStart: query.get("rangeStart") ?? undefined }, requestId);
    if (!result) throw errors.notFound();
    return result;
  });
}
