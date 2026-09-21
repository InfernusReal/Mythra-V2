import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { VocabularyRepository } from "../application/ports";

export class PrismaVocabularyRepository implements VocabularyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertProject(actor: SessionActor, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, archivedAt: null, status: "ACTIVE" }, select: { id: true } });
    if (!project) throw errors.notFound();
  }

  async isSaved(actor: SessionActor, projectId: string, normalizedTerm: string, locale: string) {
    await this.assertProject(actor, projectId);
    return Boolean(await this.prisma.savedVocabularyTerm.findUnique({ where: { userId_projectId_normalizedTerm_locale: { userId: actor.userId, projectId, normalizedTerm, locale } }, select: { id: true } }));
  }

  async mutate(actor: SessionActor, projectId: string, input: { action: "SAVE" | "REMOVE"; term: string; normalizedTerm: string; locale: string; definition?: string; partOfSpeech?: string }) {
    await this.assertProject(actor, projectId);
    if (input.action === "REMOVE") {
      const result = await this.prisma.savedVocabularyTerm.deleteMany({ where: { userId: actor.userId, projectId, normalizedTerm: input.normalizedTerm, locale: input.locale, workspaceId: actor.workspaceId } });
      return { saved: false, version: result.count ? 1 : null };
    }
    const saved = await this.prisma.savedVocabularyTerm.upsert({
      where: { userId_projectId_normalizedTerm_locale: { userId: actor.userId, projectId, normalizedTerm: input.normalizedTerm, locale: input.locale } },
      create: { userId: actor.userId, workspaceId: actor.workspaceId, projectId, term: input.term, normalizedTerm: input.normalizedTerm, locale: input.locale, definition: input.definition, partOfSpeech: input.partOfSpeech },
      update: { term: input.term, definition: input.definition, partOfSpeech: input.partOfSpeech, version: { increment: 1 } },
      select: { version: true },
    });
    return { saved: true, version: saved.version };
  }

  async list(actor: SessionActor, projectId: string, limit: number) {
    await this.assertProject(actor, projectId);
    const rows = await this.prisma.savedVocabularyTerm.findMany({ where: { userId: actor.userId, workspaceId: actor.workspaceId, projectId }, orderBy: [{ updatedAt: "desc" }, { normalizedTerm: "asc" }], take: Math.min(100, Math.max(1, limit)) });
    return rows.map((row) => ({ id: row.id, term: row.term, normalizedTerm: row.normalizedTerm, locale: row.locale, definition: row.definition, partOfSpeech: row.partOfSpeech, version: row.version, updatedAt: row.updatedAt.toISOString() }));
  }
}
