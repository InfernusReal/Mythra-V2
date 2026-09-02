import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { asAppError, errors } from "@/lib/contracts/errors";
import { failure, success } from "@/lib/contracts/envelope";
import { requestIdFrom } from "@/lib/http/request-context";
import { assertUnsafeRequestAllowed } from "@/lib/http/request-security";
import { clientOperationalEventSchema } from "@/lib/observability/operations";
import { operationsService } from "@/lib/operations/runtime";
import { getEnv } from "@/lib/env";
import { featureFlags } from "@/lib/operations/feature-flags";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    assertUnsafeRequestAllowed(request);
    const actor = await optionalActor(); if (!actor) throw errors.unauthenticated();
    await assertApiRateLimit(actor, "operations.events", 600);
    const input = clientOperationalEventSchema.parse(await request.json());
    if (!featureFlags(getEnv(), actor.workspaceId).operationalAnalytics) return NextResponse.json(success({ accepted: false }, requestId), { status: 202 });
    await operationsService().record({ ...input, workspaceId: actor.workspaceId, actorUserId: actor.userId });
    return NextResponse.json(success({ accepted: true }, requestId), { status: 202 });
  } catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught); return NextResponse.json(failure(error.code, error.message, requestId), { status: error.status }); }
}
