import { NextResponse } from "next/server";
import { optionalActor } from "@/lib/auth/runtime";
import { success, failure } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { writingService } from "@/lib/writing/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const { id } = await params;
    return NextResponse.json(success(await writingService().createChapter(actor, id, await request.json(), requestId), requestId), { status: 201 });
  }
  catch (error) { const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error); return NextResponse.json(failure(safe.code, safe.message, requestId, safe.safeDetails), { status: safe.status }); }
}
