import type { SessionActor } from "@/domains/accounts/domain/identity";
import { authorSessionToolPermissions } from "@/domains/tools/domain/permissions";
import { toolProtocolRequestSchema } from "@/domains/tools/domain/contracts";
import { optionalActor } from "@/lib/auth/runtime";
import { asAppError, errors } from "@/lib/contracts/errors";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { assertUnsafeRequestAllowed } from "@/lib/http/request-security";
import { logger } from "@/lib/observability/logger";
import { agentToolService } from "./runtime";

const protocolCode = (code: string) => code === "VALIDATION" ? -32602 : code === "UNAUTHENTICATED" ? -32001 : code === "FORBIDDEN" ? -32003 : code === "NOT_FOUND" ? -32004 : code === "RATE_LIMITED" ? -32029 : -32603;

export async function toolsHttp(request: Request, projectId: string) {
  const requestId = requestIdFrom(request.headers);
  let protocolId: string | number | null = null;
  try {
    assertUnsafeRequestAllowed(request);
    const actor: SessionActor | null = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    await assertApiRateLimit(actor, `agent-tools.protocol:${projectId}`, 60);
    const message = toolProtocolRequestSchema.parse(await request.json());
    protocolId = message.id;
    const result = message.method === "tools/list"
      ? await agentToolService().list(actor, projectId, requestId)
      : await agentToolService().call(actor, projectId, authorSessionToolPermissions, message.params.name, message.params.arguments, requestId);
    // Console trace S17-API-001: protocol completion logs identity, method and status only; tool arguments and outputs are excluded.
    logger.info("agent_tools.protocol_completed", { step: "S17-API-001", requestId, workspaceId: actor.workspaceId, projectId, methodType: message.method, status: 200 });
    return Response.json({ jsonrpc: "2.0", id: message.id, result });
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S17-API-002: protocol failure logs safe error classification and request metadata without payload content.
    logger.warn("agent_tools.protocol_failed", { step: "S17-API-002", requestId, projectId, methodType: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" });
    return Response.json({ jsonrpc: "2.0", id: protocolId, error: { code: protocolCode(error.code), message: error.message, data: { requestId, applicationCode: error.code } } }, { status: error.status });
  }
}
