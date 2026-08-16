import { captureHttp } from "@/lib/capture/http";
import { captureService } from "@/lib/capture/runtime";

export async function POST(request: Request) { return captureHttp(request, "captures.create", async (actor, requestId) => captureService().create(actor, await request.json(), requestId)); }
