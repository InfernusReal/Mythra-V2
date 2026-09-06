export interface CommandContext {
  pathname: string;
  projectId: string | null;
  chapterId: string | null;
}

export interface MythraCommand {
  id: string;
  label: string;
  shortcut: string | null;
  availability: "active" | "reserved";
  ownerSubGate: number;
  scope: "global" | "project" | "chapter";
  surface?: string;
  route?: string;
}

// Capability activation is distinct from contextual availability of a mounted handler.
export const commandRegistry = [
  { id: "command.palette", label: "Open commands", shortcut: "Mod+K", availability: "active", ownerSubGate: 0, scope: "global" },
  { id: "editor.focus", label: "Toggle Focus mode", shortcut: "Mod+Shift+F", availability: "active", ownerSubGate: 1, scope: "chapter" },
  { id: "editor.checkpoint", label: "Save checkpoint", shortcut: "Mod+S", availability: "active", ownerSubGate: 2, scope: "chapter" },
  { id: "writing.continue", label: "Continue Writing", shortcut: null, availability: "active", ownerSubGate: 3, scope: "project" },
  { id: "chapter.create", label: "Write first chapter", shortcut: null, availability: "active", ownerSubGate: 3, scope: "project" },
  { id: "project.create", label: "Create project", shortcut: null, availability: "active", ownerSubGate: 0, scope: "global" },
  { id: "structure.outline", label: "Peek chapter outline", shortcut: "Mod+Alt+O", availability: "active", ownerSubGate: 4, scope: "chapter" },
  { id: "milestone.toggle", label: "Peek linked milestone", shortcut: "Mod+Alt+M", availability: "active", ownerSubGate: 5, scope: "chapter" },
  { id: "milestone.create", label: "Create milestone", shortcut: null, availability: "active", ownerSubGate: 5, scope: "project", surface: "structure" },
  { id: "causality.cause", label: "Add cause", shortcut: null, availability: "active", ownerSubGate: 6, scope: "chapter" },
  { id: "causality.consequence", label: "Add consequence", shortcut: null, availability: "active", ownerSubGate: 6, scope: "chapter" },
  { id: "context.toggle", label: "Relevant Now / Context", shortcut: "Mod+Alt+C", availability: "active", ownerSubGate: 7, scope: "chapter" },
  { id: "capture.open", label: "Quick Capture", shortcut: "Mod+Shift+Space", availability: "active", ownerSubGate: 8, scope: "project" },
  { id: "entity.selection", label: "Create Entity from Selection", shortcut: null, availability: "active", ownerSubGate: 9, scope: "chapter" },
  { id: "entity.create", label: "Create entity", shortcut: null, availability: "active", ownerSubGate: 9, scope: "project", surface: "universe" },
  { id: "navigate.search", label: "Open full Search", shortcut: null, availability: "active", ownerSubGate: 10, scope: "project", route: "search" },
  { id: "navigate.structure", label: "Open Structure", shortcut: null, availability: "active", ownerSubGate: 4, scope: "project", route: "structure" },
  { id: "navigate.universe", label: "Open Universe", shortcut: null, availability: "active", ownerSubGate: 9, scope: "project", route: "universe" },
  { id: "navigate.timeline", label: "Open Timeline", shortcut: null, availability: "active", ownerSubGate: 11, scope: "project", route: "timeline" },
  { id: "navigate.notes", label: "Open Notes", shortcut: null, availability: "active", ownerSubGate: 11, scope: "project", route: "research" },
  { id: "navigate.research", label: "Open Research", shortcut: null, availability: "active", ownerSubGate: 11, scope: "project", route: "research" },
  { id: "navigate.captures", label: "Open Capture Inbox", shortcut: null, availability: "active", ownerSubGate: 8, scope: "project", route: "captures" },
  { id: "navigate.suggestions", label: "Open Suggestions", shortcut: null, availability: "active", ownerSubGate: 17, scope: "project", route: "suggestions" },
  { id: "portability.snapshot", label: "Create verified snapshot", shortcut: null, availability: "active", ownerSubGate: 13, scope: "project" },
  { id: "portability.manuscript", label: "Export manuscript", shortcut: null, availability: "active", ownerSubGate: 13, scope: "project" },
  { id: "portability.archive", label: "Export full project archive", shortcut: null, availability: "active", ownerSubGate: 13, scope: "project" },
] as const satisfies readonly MythraCommand[];

export type CommandId = (typeof commandRegistry)[number]["id"];

export function activeCommands(): readonly MythraCommand[] {
  return commandRegistry.filter((command) => command.availability === "active");
}

export function commandInContext(command: MythraCommand, context: CommandContext): boolean {
  return command.availability === "active"
    && (command.scope === "global" || Boolean(context.projectId))
    && (command.scope !== "chapter" || Boolean(context.chapterId));
}

export function commandHref(command: MythraCommand, context: CommandContext): string | null {
  if (!context.projectId || !commandInContext(command, context)) return null;
  if (command.id === "writing.continue" && context.chapterId && context.pathname.startsWith(`/app/projects/${context.projectId}`)) return `/app/chapters/${encodeURIComponent(context.chapterId)}`;
  if (!command.route) return null;
  const route = `/app/projects/${encodeURIComponent(context.projectId)}/${command.route}`;
  return context.chapterId ? `${route}?returnChapterId=${encodeURIComponent(context.chapterId)}` : route;
}

export function matchesCommandShortcut(event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "isComposing" | "keyCode">, id: CommandId): boolean {
  if (event.isComposing || event.keyCode === 229) return false;
  const shortcut = commandRegistry.find((command) => command.id === id)?.shortcut;
  if (!shortcut) return false;
  const parts = shortcut.split("+");
  return Boolean(event.ctrlKey || event.metaKey) === parts.includes("Mod")
    && event.altKey === parts.includes("Alt")
    && event.shiftKey === parts.includes("Shift")
    && (parts.at(-1) === "Space" ? event.code === "Space" || event.key === " " : event.key.toLowerCase() === parts.at(-1)?.toLowerCase());
}
