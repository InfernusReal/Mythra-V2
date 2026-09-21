import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
export async function POST(request: Request, { params }: { params: Promise<{ id: string; importId: string }> }) { const { id, importId } = await params; return portabilityHttp(request, "portability.import-confirm", (actor) => portabilityService().confirmImport(actor, id, importId)); }
