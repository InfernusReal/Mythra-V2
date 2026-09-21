import { researchHttp } from "@/lib/research/http";
import { researchService } from "@/lib/research/runtime";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return researchHttp(request, "research.link", async (actor, requestId) => researchService().link(actor, id, await request.json(), requestId), 201); }
