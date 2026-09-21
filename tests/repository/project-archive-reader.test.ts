import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { PrismaProjectArchiveReader } from "@/domains/portability/infrastructure/prisma-project-archive-reader";

const actor: SessionActor = { userId: "owner", workspaceId: "workspace", role: "OWNER", sessionId: "session" };
const generatedAt = new Date("2026-09-05T00:00:00Z");

function database(authorized = true) {
  let liveVersion = 1;
  const client = (snapshot?: number): object => new Proxy({}, { get: (_target, name) => {
    if (name === "project") return { findFirst: vi.fn(async () => {
      const version = snapshot ?? liveVersion;
      liveVersion = 2; // Concurrent canonical writer commits after the project's version was read.
      return authorized ? { id: "project", workspaceId: "workspace", title: "Private title", structuralVersion: version } : null;
    }) };
    return { findMany: vi.fn(async () => name === "chapter" ? [{ id: "chapter", title: "Private chapter", sequenceIndex: 0, bodyText: "Private prose", version: snapshot ?? liveVersion }] : []) };
  } });
  const transaction = vi.fn(async (read: (tx: object) => Promise<unknown>) => read(client(liveVersion)));
  const root = new Proxy(client(), { get: (target, name) => name === "$transaction" ? transaction : Reflect.get(target, name) });
  return { prisma: root as PrismaClient, transaction };
}

describe("project archive database snapshot", () => {
  it("reads authorization, version, and every collection from one repeatable-read transaction", async () => {
    const db = database();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const archive = await new PrismaProjectArchiveReader(db.prisma).build(actor, "project", generatedAt);
    expect(archive.project.structuralVersion).toBe(1);
    expect(archive.collections.chapters[0]!.version).toBe(1);
    expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead", maxWait: 5000, timeout: 30000 });
    expect(archive.generatedAt).toBe(generatedAt.toISOString());
    expect(archive.manuscriptMarkdown).toBe("# Private chapter\n\nPrivate prose");
    expect(log.mock.calls.flat().join(" ")).not.toContain("Private");
    log.mockRestore();
  });
  it("does not produce an archive for an unauthorized project", async () => {
    const db = database(false);
    await expect(new PrismaProjectArchiveReader(db.prisma).build(actor, "project", generatedAt)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
