import { errors } from "@/lib/contracts/errors";
import type { ToolPermissionLevel } from "./contracts";

export const authorSessionToolPermissions = Object.freeze(["READ", "PROPOSE", "WRITE_METADATA"] satisfies ToolPermissionLevel[]);

export function assertToolPermission(grants: readonly ToolPermissionLevel[], required: ToolPermissionLevel): void {
  if (!grants.includes(required)) throw errors.forbidden();
}

export function permissionLabel(permission: ToolPermissionLevel): "Read" | "Propose" | "Write-metadata" | "Restricted write" {
  if (permission === "READ") return "Read";
  if (permission === "PROPOSE") return "Propose";
  if (permission === "WRITE_METADATA") return "Write-metadata";
  return "Restricted write";
}
