import { suggestionService } from "@/lib/suggestions/runtime";
import { suggestionsHttp } from "@/lib/suggestions/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; suggestionId: string }> }) {
  const { id, suggestionId } = await params;
  return suggestionsHttp(request, `suggestions.detail:${id}`, (actor, requestId) => suggestionService().get(actor, id, suggestionId, requestId));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; suggestionId: string }> }) {
  const { id, suggestionId } = await params;
  return suggestionsHttp(request, `suggestions.resolve:${id}`, async (actor, requestId) => suggestionService().resolve(actor, id, suggestionId, await request.json(), requestId));
}
