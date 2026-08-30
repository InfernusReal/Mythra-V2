import { portabilityHttp } from "@/lib/portability/http";
import { portabilityService } from "@/lib/portability/runtime";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return portabilityHttp(request, "portability.status", (actor) => portabilityService().status(actor, id)); }
