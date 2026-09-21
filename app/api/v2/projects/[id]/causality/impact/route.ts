import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";

function query(request: Request) { const q = new URL(request.url).searchParams; return { endpointType: q.get("endpointType"), endpointId: q.get("endpointId"), blockId: q.get("blockId") ?? undefined, direction: q.get("direction") ?? "DOWNSTREAM", states: q.getAll("state").length ? q.getAll("state") : undefined, relationTypes: q.getAll("relationType").length ? q.getAll("relationType") : undefined, maxDepth: q.get("maxDepth") ?? undefined, nodeBudget: q.get("nodeBudget") ?? undefined, edgeBudget: q.get("edgeBudget") ?? undefined, pathBudget: q.get("pathBudget") ?? undefined }; }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.impact", 200, async (actor, requestId) => causalityService().traceImpact(actor, (await params).id, query(request), requestId)); }
