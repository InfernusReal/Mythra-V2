import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { asAppError, errors } from "@/lib/contracts/errors";
import { failure, success } from "@/lib/contracts/envelope";
import { requestIdFrom } from "@/lib/http/request-context";
import { operationsService } from "@/lib/operations/runtime";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); await assertApiRateLimit(actor, "admin.operations", 30); return NextResponse.json(success(await operationsService().adminSnapshot(actor), requestId)); }
  catch (caught) { const error = asAppError(caught); return NextResponse.json(failure(error.code, error.message, requestId), { status: error.status }); }
}
