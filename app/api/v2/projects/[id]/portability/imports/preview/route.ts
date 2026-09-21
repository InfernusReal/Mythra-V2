import { z } from "zod";
import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
import { errors } from "@/lib/contracts/errors";
const formatSchema = z.enum(["TEXT", "MARKDOWN", "DOCX"]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return portabilityHttp(request, "portability.import-preview", async (actor) => { const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) throw errors.validation("An import file is required."); const format = formatSchema.parse(form.get("format")); const idempotencyKey = z.string().min(8).max(96).parse(form.get("idempotencyKey")); return portabilityService().createImportPreview(actor, id, { format, bytes: new Uint8Array(await file.arrayBuffer()), idempotencyKey }); }); }
