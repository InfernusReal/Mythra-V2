import { universeHttp } from "@/lib/universe/http";
import { universeService } from "@/lib/universe/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return universeHttp(request, "universe.relations.create", async (actor, requestId) => universeService().createRelation(actor, id, await request.json(), requestId), 201); }
