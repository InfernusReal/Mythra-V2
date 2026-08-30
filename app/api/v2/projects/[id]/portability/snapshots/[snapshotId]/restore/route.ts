import { z } from "zod";
import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
const schema = z.object({ mode: z.enum(["SAFE_COPY", "CURRENT"]) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string; snapshotId: string }> }) { const { id, snapshotId } = await params; return portabilityHttp(request, "portability.restore", async (actor) => portabilityService().restore(actor, id, snapshotId, schema.parse(await request.json()).mode)); }
