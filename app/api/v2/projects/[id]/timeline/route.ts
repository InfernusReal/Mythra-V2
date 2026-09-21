import { timelineHttp } from "@/lib/timeline/http";
import { timelineService } from "@/lib/timeline/runtime";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return timelineHttp(request, "timeline.list", (actor, requestId) => timelineService().list(actor, id, Object.fromEntries(new URL(request.url).searchParams), requestId)); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return timelineHttp(request, "timeline.write", async (actor, requestId) => timelineService().write(actor, id, await request.json(), requestId), 201); }
