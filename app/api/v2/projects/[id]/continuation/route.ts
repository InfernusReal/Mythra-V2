import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { continuationService } from "@/lib/writing/runtime";

function responseError(error: unknown, requestId: string) {
  const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error);
  return NextResponse.json(failure(safe.code, safe.message, requestId, safe.safeDetails), { status: safe.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const { id } = await params;
    const model = await continuationService().get(actor, id, requestId);
    if (!model) throw errors.notFound();
    return NextResponse.json(success(model, requestId));
  } catch (error) { return responseError(error, requestId); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const { id } = await params;
    return NextResponse.json(success(await continuationService().save(actor, id, await request.json(), requestId), requestId));
  } catch (error) { return responseError(error, requestId); }
}
