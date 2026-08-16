import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";
import { errors } from "@/lib/contracts/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return causalityApi(request, "causality.overview", 200, async (actor, requestId) => {
    const query = new URL(request.url).searchParams;
    const result = await causalityService().getOverview(actor, (await params).id, { nodeBudget: query.get("nodeBudget") ?? undefined, edgeBudget: query.get("edgeBudget") ?? undefined }, requestId);
    if (!result) throw errors.notFound(); return result;
  });
}
