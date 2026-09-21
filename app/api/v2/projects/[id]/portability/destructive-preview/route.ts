import { z } from "zod";
import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
const schema = z.object({ objectType: z.string().min(1).max(40), objectId: z.string().uuid(), idempotencyKey: z.string().min(8).max(96) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return portabilityHttp(request, "portability.destructive-preview", async (actor) => portabilityService().destructivePreview(actor, id, schema.parse(await request.json()))); }
