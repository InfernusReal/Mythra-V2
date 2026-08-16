import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.relation.create", 201, async (actor, requestId) => causalityService().createRelation(actor, (await params).id, await request.json(), requestId)); }
