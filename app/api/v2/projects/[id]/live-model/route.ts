import { errors } from "@/lib/contracts/errors";
import { liveModelHttp } from "@/lib/live-model/http";
import { liveModelService } from "@/lib/live-model/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return liveModelHttp(request, "live-model.status", async (actor, requestId) => {
    const model = await liveModelService().status(actor, id, requestId);
    if (!model) throw errors.notFound();
    return model;
  });
}
