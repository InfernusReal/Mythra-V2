import { NextResponse } from "next/server";
import { createPreferenceService, optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    return NextResponse.json(success(await createPreferenceService().getTheme(actor, requestId), requestId));
  } catch (error) {
    const safe = asAppError(error);
    return NextResponse.json(failure(safe.code, safe.message, requestId), { status: safe.status });
  }
}

export async function PUT(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    return NextResponse.json(success(await createPreferenceService().setTheme(actor, await request.json(), requestId), requestId));
  } catch (error) {
    const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error);
    return NextResponse.json(failure(safe.code, safe.message, requestId), { status: safe.status });
  }
}
