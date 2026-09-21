import { contextApi } from "@/lib/context/http";
import { contextService } from "@/lib/context/runtime";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return contextApi(request, "context.preferences.update", async (actor, requestId) => contextService().mutatePreference(actor, (await params).id, await request.json(), requestId)); }
