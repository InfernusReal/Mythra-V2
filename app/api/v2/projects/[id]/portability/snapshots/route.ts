import { z } from "zod";
import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
const schema = z.object({ idempotencyKey: z.string().min(8).max(96) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return portabilityHttp(request, "portability.snapshot", async (actor) => portabilityService().createSnapshot(actor, id, schema.parse(await request.json()).idempotencyKey)); }
