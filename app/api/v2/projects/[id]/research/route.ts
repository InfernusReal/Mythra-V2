import { researchHttp } from "@/lib/research/http";
import { researchService } from "@/lib/research/runtime";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return researchHttp(request, "research.list", (actor, requestId) => researchService().list(actor, id, Object.fromEntries(new URL(request.url).searchParams), requestId)); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return researchHttp(request, "research.create", async (actor, requestId) => researchService().create(actor, id, await request.json(), requestId), 201); }
