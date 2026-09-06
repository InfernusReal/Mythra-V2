import { commandHref, commandInContext, commandRegistry, type CommandContext, type CommandId, type MythraCommand } from "./registry";

export interface CommandHandler {
  id: CommandId;
  projectId?: string;
  chapterId?: string;
  available?: () => boolean;
  execute: () => void | boolean | Promise<void | boolean>;
}

const handlers = new Map<symbol, CommandHandler>();
const listeners = new Set<() => void>();
let revision = 0;
export function notifyCommandContextChanged(): void {
  revision += 1;
  for (const listener of listeners) listener();
}
export const commandRevision = () => revision;
export const subscribeCommands = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function registerCommandHandlers(entries: readonly CommandHandler[]): () => void {
  const keys = entries.map((entry) => { const key = Symbol(entry.id); handlers.set(key, entry); return key; });
  notifyCommandContextChanged();
  return () => { for (const key of keys) handlers.delete(key); notifyCommandContextChanged(); };
}

function handlerFor(command: MythraCommand, context: CommandContext): CommandHandler | undefined {
  return [...handlers.values()].find((entry) => entry.id === command.id
    && (!entry.projectId || entry.projectId === context.projectId)
    && (!entry.chapterId || entry.chapterId === context.chapterId)
    && (entry.available?.() ?? true));
}

export function availableCommands(context: CommandContext): MythraCommand[] {
  return commandRegistry.filter((command) => command.id !== "command.palette" && commandInContext(command, context)
    && Boolean(commandHref(command, context) || handlerFor(command, context)));
}

export async function executeCommand(id: CommandId, context: CommandContext, navigate: (href: string) => void): Promise<boolean> {
  const command = commandRegistry.find((entry) => entry.id === id);
  if (!command || !commandInContext(command, context)) return false;
  const handler = handlerFor(command, context);
  const href = commandHref(command, context);
  let outcome: "success" | "unavailable" | "failure" = "unavailable";
  try {
    if (handler) outcome = await handler.execute() === false ? "unavailable" : "success";
    else if (href) { navigate(href); outcome = "success"; }
  } catch { outcome = "failure"; }
  // Console trace S18-COMMAND-001: command outcome uses registry identity and state only, never query, selection, payload, or error text.
  console.log(JSON.stringify({ level: "info", step: "S18-COMMAND-001", event: "command.executed", commandId: command.id, outcome }));
  return outcome === "success";
}

type WritingFocus = { projectId: string; chapterId: string; capture: () => () => void };
let writingFocus: WritingFocus | null = null;
export function registerWritingFocus(entry: WritingFocus): () => void {
  writingFocus = entry;
  return () => { if (writingFocus === entry) writingFocus = null; };
}

export function captureCommandFocus(context: CommandContext): () => void {
  const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const route = window.location.href;
  const scroll = { x: window.scrollX, y: window.scrollY };
  const input = origin instanceof HTMLInputElement || origin instanceof HTMLTextAreaElement ? origin : null;
  const textSelection = input ? { start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection } : null;
  const writer = writingFocus?.projectId === context.projectId && writingFocus?.chapterId === context.chapterId ? writingFocus.capture() : null;
  return () => {
    if (window.location.href !== route) return;
    if (writer) writer();
    if (origin?.isConnected && !origin.closest(".editor-prose")) {
      origin.focus({ preventScroll: true });
      if (input && textSelection && textSelection.start !== null && textSelection.end !== null) input.setSelectionRange(textSelection.start, textSelection.end, textSelection.direction ?? undefined);
    }
    window.scrollTo(scroll.x, scroll.y);
    // Console trace S18-COMMAND-002: palette return records restoration classes without routes, authored text, or selection payloads.
    console.log(JSON.stringify({ level: "info", step: "S18-COMMAND-002", event: "command.focus_restored", editor: Boolean(writer), input: Boolean(input) }));
  };
}
