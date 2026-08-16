import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.relation.lifecycle", 200, async (actor, requestId) => causalityService().lifecycleRelation(actor, (await params).id, await request.json(), requestId)); }
