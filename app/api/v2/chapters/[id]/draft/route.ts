import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { durabilityService } from "@/lib/writing/runtime";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const { id } = await params;
    return NextResponse.json(success(await durabilityService().save(actor, id, await request.json(), requestId), requestId));
  } catch (error) {
    const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error);
    return NextResponse.json(failure(safe.code, safe.message, requestId, safe.safeDetails), { status: safe.status });
  }
}
