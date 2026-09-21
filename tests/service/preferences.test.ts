import { describe, expect, it } from "vitest";
import { ManagePreferences } from "@/domains/accounts/application/preferences";
import { MemoryIdentityRepository } from "@/domains/accounts/infrastructure/memory-identity-repository";
import { createLogger } from "@/lib/observability/logger";

describe("ManagePreferences", () => {
  it("round-trips a theme through the actor-owned preference boundary", async () => {
    const repository = new MemoryIdentityRepository();
    const identity = await repository.resolveOrProvision({ provider: "test", subject: "preference-author", email: "preference@example.test", emailVerified: true }, "request-provision");
    const actor = { userId: identity.userId, workspaceId: identity.workspaceId, role: identity.role, sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c" };
    const service = new ManagePreferences(repository, createLogger({ service: "test" }));
    await expect(service.getTheme(actor, "request-read")).resolves.toMatchObject({ theme: "system", locale: "en" });
    await expect(service.setTheme(actor, { theme: "dark" }, "request-write")).resolves.toMatchObject({ theme: "dark" });
  });

  it("rejects unknown theme values and extra input", async () => {
    const repository = new MemoryIdentityRepository();
    const identity = await repository.resolveOrProvision({ provider: "test", subject: "invalid-preference", email: "invalid@example.test", emailVerified: true }, "request-provision");
    const actor = { userId: identity.userId, workspaceId: identity.workspaceId, role: identity.role, sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c" };
    const service = new ManagePreferences(repository, createLogger({ service: "test" }));
    await expect(service.setTheme(actor, { theme: "sepia", manuscript: "forbidden" }, "request-invalid")).rejects.toMatchObject({ name: "ZodError" });
  });
});
