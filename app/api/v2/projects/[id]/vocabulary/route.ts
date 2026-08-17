import { languageHttp } from "@/lib/language/http";
import { languageService } from "@/lib/language/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return languageHttp(request, "language.vocabulary.list", (actor, requestId) => languageService().listVocabulary(actor, id, requestId));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return languageHttp(request, "language.vocabulary.mutate", async (actor, requestId) => languageService().mutateVocabulary(actor, id, await request.json(), requestId));
}
