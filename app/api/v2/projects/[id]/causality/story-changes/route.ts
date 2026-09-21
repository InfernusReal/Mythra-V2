import { causalityApi } from "@/lib/causality/http";
import { causalityService } from "@/lib/causality/runtime";

async function write(request: Request, projectId: string, requestId: string, actor: Parameters<ReturnType<typeof causalityService>["writeStoryChange"]>[0]) { return causalityService().writeStoryChange(actor, projectId, await request.json(), requestId); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.story_change.write", 201, async (actor, requestId) => write(request, (await params).id, requestId, actor)); }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { return causalityApi(request, "causality.story_change.write", 200, async (actor, requestId) => write(request, (await params).id, requestId, actor)); }
