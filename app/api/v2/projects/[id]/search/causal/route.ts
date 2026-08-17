import { searchHttp } from "@/lib/search/http";
import { searchService } from "@/lib/search/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return searchHttp(request, "search.causal", async (actor, requestId) => searchService().causalAction(actor, id, await request.json(), requestId));
}
