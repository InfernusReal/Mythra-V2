import { errors } from "@/lib/contracts/errors";
import { MAX_RESEARCH_FILE_BYTES } from "@/domains/research/domain/types";
import { researchHttp } from "@/lib/research/http";
import { researchService } from "@/lib/research/runtime";
const MULTIPART_OVERHEAD_BUDGET = 1024 * 1024;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return researchHttp(request, "research.asset.upload", async (actor, requestId) => { const declaredLength = Number(request.headers.get("content-length")); if (Number.isFinite(declaredLength) && declaredLength > MAX_RESEARCH_FILE_BYTES + MULTIPART_OVERHEAD_BUDGET) throw errors.validation("Research upload body exceeds the supported limit."); const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) throw errors.validation("A file part is required."); return researchService().upload(actor, id, { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) }, requestId); }, 201); }
