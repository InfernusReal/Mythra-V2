import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { success, failure } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { writingService } from "@/lib/writing/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const { id } = await params;
    const model = await writingService().getEditor(actor, id, requestId);
    if (!model) throw errors.notFound();
    return NextResponse.json(success(model, requestId));
  } catch (error) {
    const safe = asAppError(error);
    return NextResponse.json(failure(safe.code, safe.message, requestId), { status: safe.status });
  }
}
