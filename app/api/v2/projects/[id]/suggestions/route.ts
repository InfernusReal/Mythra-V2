import { suggestionService } from "@/lib/suggestions/runtime";
import { suggestionsHttp } from "@/lib/suggestions/http";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return suggestionsHttp(request, `suggestions.list:${id}`, (actor, requestId) => suggestionService().list(actor, id, Object.fromEntries(new URL(request.url).searchParams), requestId));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return suggestionsHttp(request, `suggestions.create:${id}`, async (actor, requestId) => suggestionService().create(actor, id, await request.json(), requestId), 201);
}
