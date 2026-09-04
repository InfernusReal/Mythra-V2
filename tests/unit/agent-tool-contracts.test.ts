import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { agentToolDefinitions, agentToolNames, chapterTextToolSchema, noteToolSchema, timelineWindowToolSchema } from "@/domains/tools/domain/contracts";
import { assertToolPermission, authorSessionToolPermissions, permissionLabel } from "@/domains/tools/domain/permissions";

describe("agent tool contracts", () => {
  it("publishes the exact stable V2 registry with JSON schemas and four permission labels", () => {
    const definitions = agentToolDefinitions();
    expect(definitions.map((tool) => tool.name)).toEqual(agentToolNames);
    expect(definitions).toHaveLength(20);
    expect(new Set(definitions.map((tool) => tool.permission))).toEqual(new Set(["READ", "PROPOSE", "WRITE_METADATA", "RESTRICTED_WRITE"]));
    expect(definitions.every((tool) => tool.inputSchema.type === "object")).toBe(true);
    expect(definitions.every((tool) => tool.outputSchema.type === "object")).toBe(true);
    expect(permissionLabel("WRITE_METADATA")).toBe("Write-metadata");
    expect(permissionLabel("RESTRICTED_WRITE")).toBe("Restricted write");
  });

  it("enforces reader bounds and explicit confirmation on metadata writes", () => {
    expect(chapterTextToolSchema.parse({ chapterId: randomUUID(), start: 0, length: 8_000 }).length).toBe(8_000);
    expect(() => chapterTextToolSchema.parse({ chapterId: randomUUID(), length: 8_001 })).toThrow();
    expect(() => timelineWindowToolSchema.parse({ before: 51, after: 0 })).toThrow();
    expect(() => noteToolSchema.parse({ authorConfirmed: false, idempotencyKey: "a", title: "t", body: "" })).toThrow();
    expect(noteToolSchema.parse({ authorConfirmed: true, idempotencyKey: "a", title: "t", body: "" }).authorConfirmed).toBe(true);
  });

  it("never grants restricted prose write to an author session", () => {
    expect(authorSessionToolPermissions).toEqual(["READ", "PROPOSE", "WRITE_METADATA"]);
    expect(() => assertToolPermission(authorSessionToolPermissions, "RESTRICTED_WRITE")).toThrow();
  });

  it("keeps transport and application layers free of direct Prisma access", () => {
    const protectedFiles = ["domains/tools/application/service.ts", "app/api/v2/projects/[id]/tools/route.ts", "lib/tools/http.ts"];
    for (const file of protectedFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/generated\/prisma|\.suggestion\.|\.chapter\.|\$queryRaw/u);
    }
  });
});
