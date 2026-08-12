import { z } from "zod";
import type { Logger } from "@/lib/observability/logger";
import type { SessionActor } from "../domain/identity";
import type { IdentityRepository, UserPreferenceReadModel } from "./ports";

const themeInputSchema = z.object({ theme: z.enum(["light", "dark", "system"]) }).strict();

export class ManagePreferences {
  constructor(private readonly identities: IdentityRepository, private readonly logger: Logger) {}

  async getTheme(actor: SessionActor, requestId: string): Promise<UserPreferenceReadModel> {
    const preference = await this.identities.getPreference(actor);
    // Console trace S0-PREFERENCE-001: an ownership-scoped preference read completed; no author content is emitted.
    this.logger.info("preference.theme_read", { requestId, userId: actor.userId, workspaceId: actor.workspaceId, theme: preference.theme });
    return preference;
  }

  async setTheme(actor: SessionActor, rawInput: unknown, requestId: string): Promise<UserPreferenceReadModel> {
    const input = themeInputSchema.parse(rawInput);
    await this.identities.updatePreference(actor, input);
    // Console trace S0-PREFERENCE-002: an ownership-scoped theme preference write completed; only the enum value is emitted.
    this.logger.info("preference.theme_updated", { requestId, userId: actor.userId, workspaceId: actor.workspaceId, theme: input.theme });
    return this.identities.getPreference(actor);
  }
}
