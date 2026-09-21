import { z } from "zod";

export const workspaceRoles = ["OWNER", "ADMIN", "MEMBER"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const externalPrincipalSchema = z.object({
  provider: z.string().min(1).max(64),
  subject: z.string().min(1).max(255),
  email: z.string().email().max(320),
  displayName: z.string().trim().min(1).max(160).optional(),
  emailVerified: z.boolean()
});

export type ExternalPrincipal = z.infer<typeof externalPrincipalSchema>;

export interface SessionActor {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  sessionId: string;
}
