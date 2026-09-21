import { languageHttp } from "@/lib/language/http";
import { languageService } from "@/lib/language/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return languageHttp(request, "language.lookup", async (actor, requestId) => languageService().lookup(actor, id, await request.json(), requestId));
}
