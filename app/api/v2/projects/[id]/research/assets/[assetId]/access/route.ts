import { researchHttp } from "@/lib/research/http";
import { researchService } from "@/lib/research/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await params;
  return researchHttp(request, "research.asset.access", (actor, requestId) => researchService().issueAssetAccess(actor, id, assetId, requestId));
}
