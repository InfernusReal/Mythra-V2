import { randomUUID } from "node:crypto";
import type { ExternalPrincipal, SessionActor } from "../domain/identity";
import type { IdentityRecord, IdentityRepository, UserPreferenceReadModel } from "../application/ports";

export class MemoryIdentityRepository implements IdentityRepository {
  private readonly identities = new Map<string, IdentityRecord>();
  private readonly preferences = new Map<string, UserPreferenceReadModel>();

  async resolveOrProvision(principal: ExternalPrincipal, _correlationId: string): Promise<IdentityRecord> {
    void _correlationId;
    const key = `${principal.provider}:${principal.subject}`;
    const existing = this.identities.get(key);
    if (existing) return { ...existing, createdWorkspace: false };
    const created: IdentityRecord = {
      userId: randomUUID(),
      workspaceId: randomUUID(),
      role: "OWNER",
      createdWorkspace: true
    };
    this.identities.set(key, created);
    this.preferences.set(`${created.userId}:${created.workspaceId}`, { theme: "system", locale: "en" });
    return created;
  }

  async findActor(userId: string, workspaceId: string, sessionId: string): Promise<SessionActor | null> {
    const record = [...this.identities.values()].find(
      (candidate) => candidate.userId === userId && candidate.workspaceId === workspaceId
    );
    return record ? { userId, workspaceId, role: record.role, sessionId } : null;
  }

  async updatePreference(_actor: SessionActor, _input: { locale?: string; theme?: string }): Promise<void> {
    const key = `${_actor.userId}:${_actor.workspaceId}`;
    const current = this.preferences.get(key) ?? { theme: "system" as const, locale: "en" };
    this.preferences.set(key, {
      theme: (_input.theme as UserPreferenceReadModel["theme"] | undefined) ?? current.theme,
      locale: _input.locale ?? current.locale
    });
  }

  async getPreference(actor: SessionActor): Promise<UserPreferenceReadModel> {
    return this.preferences.get(`${actor.userId}:${actor.workspaceId}`) ?? { theme: "system", locale: "en" };
  }
}
