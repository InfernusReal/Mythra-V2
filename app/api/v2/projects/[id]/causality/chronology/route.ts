import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.chronology", 200, async (actor, requestId) => causalityService().validateChronology(actor, (await params).id, await request.json(), requestId)); }
