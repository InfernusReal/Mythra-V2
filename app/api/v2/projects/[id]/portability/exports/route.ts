import { z } from "zod";
import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
const schema = z.object({ idempotencyKey: z.string().min(8).max(96), scope: z.enum(["CHAPTER", "VOLUME", "MANUSCRIPT", "FULL_PROJECT"]), format: z.enum(["TEXT", "MARKDOWN", "MYTHRA_JSON"]), sourceObjectId: z.string().uuid().optional() }).strict().superRefine((value, context) => { if ((value.scope === "CHAPTER" || value.scope === "VOLUME") && !value.sourceObjectId) context.addIssue({ code: "custom", message: "The selected scope requires a source object." }); });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return portabilityHttp(request, "portability.export", async (actor) => portabilityService().createExport(actor, id, schema.parse(await request.json()))); }
