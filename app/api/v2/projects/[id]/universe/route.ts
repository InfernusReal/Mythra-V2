import { universeHttp } from "@/lib/universe/http";
import { universeService } from "@/lib/universe/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const query = Object.fromEntries(new URL(request.url).searchParams); return universeHttp(request, "universe.list", (actor, requestId) => universeService().list(actor, id, query, requestId)); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return universeHttp(request, "universe.create", async (actor, requestId) => universeService().create(actor, id, await request.json(), requestId), 201); }
