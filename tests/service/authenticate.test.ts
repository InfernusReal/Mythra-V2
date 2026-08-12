import { describe, expect, it } from "vitest";
import { AuthenticateUser } from "@/domains/accounts/application/authenticate";
import { DevelopmentAuthAdapter } from "@/domains/accounts/infrastructure/development-auth-adapter";
import { MemoryIdentityRepository } from "@/domains/accounts/infrastructure/memory-identity-repository";
import { createLogger } from "@/lib/observability/logger";
import { InMemoryMetricsSink } from "@/lib/observability/metrics";

describe("AuthenticateUser", () => {
  it("creates a workspace on first authenticated use and reuses it", async () => {
    const service = new AuthenticateUser(
      new DevelopmentAuthAdapter({ provider: "test", subject: "author-1", email: "author@example.test", emailVerified: true }, "valid"),
      new MemoryIdentityRepository(), createLogger({ service: "test" }), new InMemoryMetricsSink()
    );
    const first = await service.execute("valid", "request-one");
    const second = await service.execute("valid", "request-two");
    expect(second).toMatchObject({ userId: first.userId, workspaceId: first.workspaceId, role: "OWNER" });
  });

  it("rejects an invalid provider credential", async () => {
    const service = new AuthenticateUser(
      new DevelopmentAuthAdapter({ provider: "test", subject: "author-1", email: "author@example.test", emailVerified: true }, "valid"),
      new MemoryIdentityRepository(), createLogger({ service: "test" }), new InMemoryMetricsSink()
    );
    await expect(service.execute("invalid", "request-one")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("returns actors only for matching user and workspace ownership", async () => {
    const repository = new MemoryIdentityRepository();
    const record = await repository.resolveOrProvision({
      provider: "test", subject: "author-2", email: "second@example.test", emailVerified: true
    }, "request-three");
    await expect(repository.findActor(record.userId, record.workspaceId, "608b547d-41f8-449c-96c2-27b5fa3b058c"))
      .resolves.toMatchObject({ role: "OWNER" });
    await expect(repository.findActor(record.userId, "a873e0d0-e22f-4cd0-a7f9-484546489adc", "608b547d-41f8-449c-96c2-27b5fa3b058c"))
      .resolves.toBeNull();
    await expect(repository.updatePreference({ userId: record.userId, workspaceId: record.workspaceId, role: "OWNER", sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c" }, { theme: "dark" })).resolves.toBeUndefined();
  });
});
