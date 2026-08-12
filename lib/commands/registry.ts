export type CommandAvailability = "active" | "reserved";

export interface MythraCommand {
  id: string;
  label: string;
  shortcut: string;
  availability: CommandAvailability;
  ownerSubGate: number;
}

export const commandRegistry = [
  { id: "command.palette", label: "Open commands", shortcut: "Mod+K", availability: "active", ownerSubGate: 0 },
  { id: "editor.focus", label: "Toggle Focus mode", shortcut: "Mod+Shift+F", availability: "active", ownerSubGate: 1 },
  { id: "editor.checkpoint", label: "Save checkpoint", shortcut: "Mod+S", availability: "reserved", ownerSubGate: 2 },
  { id: "structure.outline", label: "Toggle outline", shortcut: "Mod+Alt+O", availability: "reserved", ownerSubGate: 4 },
  { id: "milestone.toggle", label: "Toggle milestone", shortcut: "Mod+Alt+M", availability: "reserved", ownerSubGate: 5 },
  { id: "context.toggle", label: "Toggle context", shortcut: "Mod+.", availability: "reserved", ownerSubGate: 7 },
  { id: "capture.open", label: "Open Capture", shortcut: "Mod+Shift+Space", availability: "reserved", ownerSubGate: 8 }
] as const satisfies readonly MythraCommand[];

export function activeCommands(): readonly MythraCommand[] {
  return commandRegistry.filter((command) => command.availability === "active");
}
