import { contextApi } from "@/lib/context/http";
import { contextService } from "@/lib/context/runtime";

function query(request: Request) { const params = new URL(request.url).searchParams; return { cursorBlockId: params.get("cursorBlockId") ?? undefined, selectedIds: params.getAll("selectedId"), peekType: params.get("peekType") ?? undefined, peekId: params.get("peekId") ?? undefined, activeCausalType: params.get("activeCausalType") ?? undefined, activeCausalId: params.get("activeCausalId") ?? undefined, activeCausalBlockId: params.get("activeCausalBlockId") ?? undefined, requestedContextKey: params.get("requestedContextKey") ?? undefined, cardCap: params.get("cardCap") ?? undefined }; }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return contextApi(request, "context.chapter.read", async (actor, requestId) => contextService().get(actor, (await params).id, query(request), requestId)); }
