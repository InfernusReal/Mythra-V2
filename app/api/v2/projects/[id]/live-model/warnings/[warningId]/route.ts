import { z } from "zod";
import { liveModelHttp } from "@/lib/live-model/http";
import { liveModelService } from "@/lib/live-model/runtime";

const mutationSchema = z.object({ suppressed: z.boolean() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; warningId: string }> }) {
  const { id, warningId } = await params;
  return liveModelHttp(request, "live-model.warning", async (actor, requestId) => {
    const input = mutationSchema.parse(await request.json());
    return liveModelService().suppress(actor, id, warningId, input.suppressed, requestId);
  });
}
