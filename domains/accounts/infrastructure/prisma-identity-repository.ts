import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { ExternalPrincipal, SessionActor } from "../domain/identity";
import type { IdentityRecord, IdentityRepository, UserPreferenceReadModel } from "../application/ports";

export class PrismaIdentityRepository implements IdentityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async findProvisioned(principal: ExternalPrincipal): Promise<IdentityRecord | null> {
    const existing = await this.prisma.externalIdentity.findUnique({
      where: { provider_providerSubject: { provider: principal.provider, providerSubject: principal.subject } },
      include: { user: { include: { memberships: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, take: 1 } } } }
    });
    const membership = existing?.user.memberships[0];
    if (!existing || !membership) return null;
    return {
      userId: existing.userId,
      workspaceId: membership.workspaceId,
      role: membership.role,
      createdWorkspace: false
    };
  }

  async resolveOrProvision(principal: ExternalPrincipal, correlationId: string): Promise<IdentityRecord> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.externalIdentity.findUnique({
          where: { provider_providerSubject: { provider: principal.provider, providerSubject: principal.subject } },
          include: { user: { include: { memberships: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, take: 1 } } } }
        });
        const membership = existing?.user.memberships[0];
        if (existing && membership) {
          await transaction.externalIdentity.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), ...(principal.emailVerified && !existing.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {}) } });
          return {
            userId: existing.userId,
            workspaceId: membership.workspaceId,
            role: membership.role,
            createdWorkspace: false
          };
        }

        const created = await transaction.user.create({
          data: {
            email: principal.email.toLocaleLowerCase("en-US"),
            displayName: principal.displayName,
            externalIdentities: {
              create: { provider: principal.provider, providerSubject: principal.subject, emailVerifiedAt: principal.emailVerified ? new Date() : null }
            }
          }
        });
        const workspace = await transaction.workspace.create({
          data: {
            ownerUserId: created.id,
            name: principal.displayName ? `${principal.displayName}'s workspace` : "My workspace",
            members: { create: { userId: created.id, role: "OWNER", status: "ACTIVE" } }
          }
        });
        await transaction.userPreference.create({
          data: { userId: created.id, workspaceId: workspace.id }
        });
        await transaction.auditEvent.create({
          data: {
            workspaceId: workspace.id,
            actorUserId: created.id,
            kind: "AUTHENTICATION",
            targetType: "Workspace",
            targetId: workspace.id,
            correlationId,
            safeMetadata: { action: "first_authenticated_use" }
          }
        });
        return {
          userId: created.id,
          workspaceId: workspace.id,
          role: "OWNER" as const,
          createdWorkspace: true
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrentWinner = await this.findProvisioned(principal);
        if (concurrentWinner) return concurrentWinner;
      }
      throw error;
    }
  }

  async findActor(userId: string, workspaceId: string, sessionId: string): Promise<SessionActor | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { userId: true, workspaceId: true, role: true, status: true, workspace: { select: { archivedAt: true } } }
    });
    if (!membership || membership.status !== "ACTIVE" || membership.workspace.archivedAt) return null;
    return { userId: membership.userId, workspaceId: membership.workspaceId, role: membership.role, sessionId };
  }

  async updatePreference(actor: SessionActor, input: { locale?: string; theme?: string }): Promise<void> {
    await this.prisma.userPreference.update({
      where: { userId_workspaceId: { userId: actor.userId, workspaceId: actor.workspaceId } },
      data: input
    });
  }

  async getPreference(actor: SessionActor): Promise<UserPreferenceReadModel> {
    const preference = await this.prisma.userPreference.findUniqueOrThrow({
      where: { userId_workspaceId: { userId: actor.userId, workspaceId: actor.workspaceId } },
      select: { theme: true, locale: true }
    });
    if (preference.theme !== "light" && preference.theme !== "dark" && preference.theme !== "cream" && preference.theme !== "system") {
      return { theme: "system", locale: preference.locale };
    }
    return preference as UserPreferenceReadModel;
  }
}
