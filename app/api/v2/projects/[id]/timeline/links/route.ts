import { timelineHttp } from "@/lib/timeline/http";
import { timelineService } from "@/lib/timeline/runtime";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return timelineHttp(request, "timeline.link", async (actor, requestId) => timelineService().link(actor, id, await request.json(), requestId), 201); }
