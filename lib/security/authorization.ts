import type { SessionActor, WorkspaceRole } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";

const rank: Readonly<Record<WorkspaceRole, number>> = Object.freeze({ MEMBER: 1, ADMIN: 2, OWNER: 3 });

export function requireWorkspaceRole(actor: SessionActor, minimum: WorkspaceRole): SessionActor {
  if (rank[actor.role] < rank[minimum]) throw errors.forbidden();
  return actor;
}

export function assertWorkspaceScope(actor: SessionActor, workspaceId: string): void {
  if (actor.workspaceId !== workspaceId) throw errors.notFound();
}
