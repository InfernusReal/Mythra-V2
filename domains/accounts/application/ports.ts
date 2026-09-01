import type { ExternalPrincipal, SessionActor, WorkspaceRole } from "../domain/identity";

export interface ExternalAuthAdapter {
  readonly provider: string;
  verifyCredential(credential: string): Promise<ExternalPrincipal>;
}

export interface IdentityRecord {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdWorkspace: boolean;
}

export interface UserPreferenceReadModel {
  theme: "light" | "dark" | "cream" | "system";
  locale: string;
}

export interface IdentityRepository {
  resolveOrProvision(principal: ExternalPrincipal, correlationId: string): Promise<IdentityRecord>;
  findActor(userId: string, workspaceId: string, sessionId: string): Promise<SessionActor | null>;
  getPreference(actor: SessionActor): Promise<UserPreferenceReadModel>;
  updatePreference(actor: SessionActor, input: { locale?: string; theme?: string }): Promise<void>;
}
