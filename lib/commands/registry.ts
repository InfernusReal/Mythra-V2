export interface CommandContext {
  pathname: string;
  projectId: string | null;
  chapterId: string | null;
}

export interface MythraCommand {
  id: string;
  labelKey: MessageKey;
  shortcut: string | null;
  availability: "active" | "reserved";
  ownerSubGate: number;
  scope: "global" | "project" | "chapter";
  surface?: string;
  route?: string;
}

// Capability activation is distinct from contextual availability of a mounted handler.
export const commandRegistry = [
  {
    id: "command.palette",
    labelKey: "commandOpenCommands",
    shortcut: "Mod+K",
    availability: "active",
    ownerSubGate: 0,
    scope: "global",
  },
  {
    id: "editor.focus",
    labelKey: "commandToggleFocusMode",
    shortcut: "Mod+Shift+F",
    availability: "active",
    ownerSubGate: 1,
    scope: "chapter",
  },
  {
    id: "editor.checkpoint",
    labelKey: "commandSaveCheckpoint",
    shortcut: "Mod+S",
    availability: "active",
    ownerSubGate: 2,
    scope: "chapter",
  },
  {
    id: "writing.continue",
    labelKey: "commandContinueWriting",
    shortcut: null,
    availability: "active",
    ownerSubGate: 3,
    scope: "project",
  },
  {
    id: "chapter.create",
    labelKey: "commandWriteFirstChapter",
    shortcut: null,
    availability: "active",
    ownerSubGate: 3,
    scope: "project",
  },
  {
    id: "project.create",
    labelKey: "commandCreateProject",
    shortcut: null,
    availability: "active",
    ownerSubGate: 0,
    scope: "global",
  },
  {
    id: "structure.outline",
    labelKey: "commandPeekChapterOutline",
    shortcut: "Mod+Alt+O",
    availability: "active",
    ownerSubGate: 4,
    scope: "chapter",
  },
  {
    id: "milestone.toggle",
    labelKey: "commandPeekLinkedMilestone",
    shortcut: "Mod+Alt+M",
    availability: "active",
    ownerSubGate: 5,
    scope: "chapter",
  },
  {
    id: "milestone.create",
    labelKey: "commandCreateMilestone",
    shortcut: null,
    availability: "active",
    ownerSubGate: 5,
    scope: "project",
    surface: "structure",
  },
  {
    id: "causality.cause",
    labelKey: "commandAddCause",
    shortcut: null,
    availability: "active",
    ownerSubGate: 6,
    scope: "chapter",
  },
  {
    id: "causality.consequence",
    labelKey: "commandAddConsequence",
    shortcut: null,
    availability: "active",
    ownerSubGate: 6,
    scope: "chapter",
  },
  {
    id: "context.toggle",
    labelKey: "commandRelevantNowContext",
    shortcut: "Mod+Alt+C",
    availability: "active",
    ownerSubGate: 7,
    scope: "chapter",
  },
  {
    id: "capture.open",
    labelKey: "commandQuickCapture",
    shortcut: "Mod+Shift+Space",
    availability: "active",
    ownerSubGate: 8,
    scope: "project",
  },
  {
    id: "entity.selection",
    labelKey: "commandCreateEntityFromSelection",
    shortcut: null,
    availability: "active",
    ownerSubGate: 9,
    scope: "chapter",
  },
  {
    id: "entity.create",
    labelKey: "commandCreateEntity",
    shortcut: null,
    availability: "active",
    ownerSubGate: 9,
    scope: "project",
    surface: "universe",
  },
  {
    id: "navigate.search",
    labelKey: "commandOpenFullSearch",
    shortcut: null,
    availability: "active",
    ownerSubGate: 10,
    scope: "project",
    route: "search",
  },
  {
    id: "navigate.structure",
    labelKey: "commandOpenStructure",
    shortcut: null,
    availability: "active",
    ownerSubGate: 4,
    scope: "project",
    route: "structure",
  },
  {
    id: "navigate.universe",
    labelKey: "commandOpenUniverse",
    shortcut: null,
    availability: "active",
    ownerSubGate: 9,
    scope: "project",
    route: "universe",
  },
  {
    id: "navigate.timeline",
    labelKey: "commandOpenTimeline",
    shortcut: null,
    availability: "active",
    ownerSubGate: 11,
    scope: "project",
    route: "timeline",
  },
  {
    id: "navigate.notes",
    labelKey: "commandOpenNotes",
    shortcut: null,
    availability: "active",
    ownerSubGate: 11,
    scope: "project",
    route: "research",
  },
  {
    id: "navigate.research",
    labelKey: "commandOpenResearch",
    shortcut: null,
    availability: "active",
    ownerSubGate: 11,
    scope: "project",
    route: "research",
  },
  {
    id: "navigate.captures",
    labelKey: "commandOpenCaptureInbox",
    shortcut: null,
    availability: "active",
    ownerSubGate: 8,
    scope: "project",
    route: "captures",
  },
  {
    id: "navigate.suggestions",
    labelKey: "commandOpenSuggestions",
    shortcut: null,
    availability: "active",
    ownerSubGate: 17,
    scope: "project",
    route: "suggestions",
  },
  {
    id: "portability.snapshot",
    labelKey: "commandCreateVerifiedSnapshot",
    shortcut: null,
    availability: "active",
    ownerSubGate: 13,
    scope: "project",
  },
  {
    id: "portability.manuscript",
    labelKey: "commandExportManuscript",
    shortcut: null,
    availability: "active",
    ownerSubGate: 13,
    scope: "project",
  },
  {
    id: "portability.archive",
    labelKey: "commandExportFullProjectArchive",
    shortcut: null,
    availability: "active",
    ownerSubGate: 13,
    scope: "project",
  },
] as const satisfies readonly MythraCommand[];

export type CommandId = (typeof commandRegistry)[number]["id"];

export function activeCommands(): readonly MythraCommand[] {
  return commandRegistry.filter((command) => command.availability === "active");
}

export function commandInContext(
  command: MythraCommand,
  context: CommandContext,
): boolean {
  return (
    command.availability === "active" &&
    (command.scope === "global" || Boolean(context.projectId)) &&
    (command.scope !== "chapter" || Boolean(context.chapterId))
  );
}

export function commandHref(
  command: MythraCommand,
  context: CommandContext,
): string | null {
  if (!context.projectId || !commandInContext(command, context)) return null;
  if (
    command.id === "writing.continue" &&
    context.chapterId &&
    context.pathname.startsWith(`/app/projects/${context.projectId}`)
  )
    return `/app/chapters/${encodeURIComponent(context.chapterId)}`;
  if (!command.route) return null;
  const route = `/app/projects/${encodeURIComponent(context.projectId)}/${command.route}`;
  return context.chapterId
    ? `${route}?returnChapterId=${encodeURIComponent(context.chapterId)}`
    : route;
}

export function matchesCommandShortcut(
  event: Pick<
    KeyboardEvent,
    | "key"
    | "code"
    | "ctrlKey"
    | "metaKey"
    | "altKey"
    | "shiftKey"
    | "isComposing"
    | "keyCode"
  >,
  id: CommandId,
): boolean {
  if (event.isComposing || event.keyCode === 229) return false;
  const shortcut = commandRegistry.find(
    (command) => command.id === id,
  )?.shortcut;
  if (!shortcut) return false;
  const parts = shortcut.split("+");
  return (
    Boolean(event.ctrlKey || event.metaKey) === parts.includes("Mod") &&
    event.altKey === parts.includes("Alt") &&
    event.shiftKey === parts.includes("Shift") &&
    (parts.at(-1) === "Space"
      ? event.code === "Space" || event.key === " "
      : event.key.toLowerCase() === parts.at(-1)?.toLowerCase())
  );
}
import type { MessageKey } from "@/lib/i18n/messages";
