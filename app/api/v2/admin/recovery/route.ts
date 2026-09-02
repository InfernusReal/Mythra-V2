import { NextResponse } from "next/server";
import { z } from "zod";
import { optionalActor } from "@/lib/auth/runtime";
import { asAppError, errors } from "@/lib/contracts/errors";
import { failure, success } from "@/lib/contracts/envelope";
import { requestIdFrom } from "@/lib/http/request-context";
import { assertUnsafeRequestAllowed } from "@/lib/http/request-security";
import { operationsService } from "@/lib/operations/runtime";
import { getEnv } from "@/lib/env";
import { featureFlags } from "@/lib/operations/feature-flags";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";

const schema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("PREVIEW"), targetId: z.string().uuid() }).strict(),
  z.object({ operation: z.literal("CONFIRM"), recoveryId: z.string().uuid(), targetId: z.string().uuid(), confirmationToken: z.string().min(40).max(4096), phrase: z.string().max(80) }).strict()
]);

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try { assertUnsafeRequestAllowed(request); const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); await assertApiRateLimit(actor, "admin.recovery", 20); if (!featureFlags(getEnv(), actor.workspaceId).adminRecovery) throw errors.forbidden(); const input = schema.parse(await request.json()); const data = input.operation === "PREVIEW" ? await operationsService().previewOutboxRecovery(actor, input.targetId) : await operationsService().confirmOutboxRecovery(actor, input); return NextResponse.json(success(data, requestId)); }
  catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught); return NextResponse.json(failure(error.code, error.message, requestId), { status: error.status }); }
}
