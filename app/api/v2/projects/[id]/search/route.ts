import { searchHttp } from "@/lib/search/http";
import { searchService } from "@/lib/search/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const values = new URL(request.url).searchParams;
  const types = values.getAll("type");
  const query = { query: values.get("query"), limit: values.get("limit") ?? undefined, cursor: values.get("cursor") ?? undefined, chapterId: values.get("chapterId") ?? undefined, blockId: values.get("blockId") ?? undefined, ...(types.length ? { types } : {}) };
  return searchHttp(request, "search.query", (actor, requestId) => searchService().query(actor, id, query, requestId));
}
