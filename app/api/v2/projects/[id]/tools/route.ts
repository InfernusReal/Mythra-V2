import { toolsHttp } from "@/lib/tools/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toolsHttp(request, id);
}
