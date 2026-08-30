import { liveModelHttp } from "@/lib/live-model/http";
import { liveModelService } from "@/lib/live-model/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return liveModelHttp(request, "live-model.rebuild", (actor, requestId) => liveModelService().rebuild(actor, id, requestId));
}
