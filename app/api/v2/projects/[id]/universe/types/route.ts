import { universeHttp } from "@/lib/universe/http";
import { universeService } from "@/lib/universe/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return universeHttp(request, "universe.catalog", (actor, requestId) => universeService().catalog(actor, id, requestId)); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return universeHttp(request, "universe.types.create", async (actor, requestId) => universeService().createType(actor, id, await request.json(), requestId), 201); }
