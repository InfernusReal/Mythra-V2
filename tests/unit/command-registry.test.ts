import { describe, expect, it, vi } from "vitest";
import { activeCommands, commandRegistry, commandHref, matchesCommandShortcut, type CommandContext, type CommandId } from "@/lib/commands/registry";
import { availableCommands, executeCommand, registerCommandHandlers } from "@/lib/commands/runtime";

const context: CommandContext = { pathname: "/app/chapters/test", projectId: "b0000000-0000-4000-8000-000000000001", chapterId: "b0000000-0000-4000-8000-000000000002" };

describe("command registry capability gating", () => {
  it("activates the complete implemented S0-S17 command catalog without AI", () => {
    expect(activeCommands()).toHaveLength(26);
    expect(new Set(commandRegistry.map((command) => command.id)).size).toBe(26);
    expect(commandRegistry.every((command) => command.ownerSubGate <= 17)).toBe(true);
    expect(commandRegistry.map((command) => command.id)).toEqual([
      "command.palette", "editor.focus", "editor.checkpoint", "writing.continue", "chapter.create", "project.create", "structure.outline", "milestone.toggle", "milestone.create", "causality.cause", "causality.consequence", "context.toggle", "capture.open", "entity.selection", "entity.create", "navigate.search", "navigate.structure", "navigate.universe", "navigate.timeline", "navigate.notes", "navigate.research", "navigate.captures", "navigate.suggestions", "portability.snapshot", "portability.manuscript", "portability.archive",
    ]);
  });

  it("matches every Bible 8.7 shortcut exactly with no collision", () => {
    const shortcuts = commandRegistry.flatMap((command) => command.shortcut ? [command.shortcut] : []);
    expect(shortcuts).toEqual([
      "Mod+K", "Mod+Shift+F", "Mod+S", "Mod+Alt+O", "Mod+Alt+M", "Mod+Alt+C", "Mod+Shift+Space"
    ]);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
    for (const command of commandRegistry.filter((entry) => entry.shortcut)) {
      const parts = command.shortcut!.split("+");
      for (const mod of ["ctrlKey", "metaKey"]) {
        const event = new KeyboardEvent("keydown", { key: parts.at(-1) === "Space" ? " " : parts.at(-1), code: parts.at(-1) === "Space" ? "Space" : undefined, [mod]: true, altKey: parts.includes("Alt"), shiftKey: parts.includes("Shift") });
        expect(commandRegistry.filter((entry) => matchesCommandShortcut(event, entry.id)).map((entry) => entry.id)).toEqual([command.id]);
      }
    }
    expect(matchesCommandShortcut(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, isComposing: true }), "command.palette")).toBe(false);
    expect(matchesCommandShortcut(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, altKey: true }), "editor.checkpoint")).toBe(false);
    expect(matchesCommandShortcut(new KeyboardEvent("keydown", { key: "c", ctrlKey: true }), "context.toggle")).toBe(false);
    expect(matchesCommandShortcut(new KeyboardEvent("keydown", { key: "x", keyCode: 229 }), "command.palette")).toBe(false);
  });

  it("requires mounted available handlers and matching project/chapter coordinates", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    let selected = false;
    const action = vi.fn();
    const dispose = registerCommandHandlers([{ id: "entity.selection", projectId: context.projectId!, chapterId: context.chapterId!, available: () => selected, execute: action }]);
    const hasEntity = (value: CommandContext) => availableCommands(value).some((command) => command.id === "entity.selection");
    expect(hasEntity(context)).toBe(false);
    expect(await executeCommand("entity.selection", context, vi.fn())).toBe(false);
    selected = true;
    expect(hasEntity(context)).toBe(true);
    expect(hasEntity({ ...context, chapterId: "another" })).toBe(false);
    expect(hasEntity({ ...context, projectId: "another" })).toBe(false);
    expect(await executeCommand("entity.selection", context, vi.fn())).toBe(true);
    expect(action).toHaveBeenCalledOnce();
    dispose();
    expect(hasEntity(context)).toBe(false);
    expect(await executeCommand("missing" as CommandId, context, vi.fn())).toBe(false);
  });

  it("keeps project navigation distinct from in-flow action availability and preserves return context", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const navigate = vi.fn();
    expect(await executeCommand("navigate.timeline", context, navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledWith(`/app/projects/${context.projectId}/timeline?returnChapterId=${context.chapterId}`);
    expect(availableCommands({ pathname: "/app", projectId: null, chapterId: null })).toEqual([]);
    expect(await executeCommand("navigate.timeline", { ...context, projectId: null }, navigate)).toBe(false);
    expect(commandHref(commandRegistry[0], context)).toBeNull();
    expect(availableCommands({ ...context, chapterId: null }).every((entry) => entry.scope !== "chapter")).toBe(true);
  });

  it("contains handler failures and rejected outcomes without private logging", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const dispose = registerCommandHandlers([{ id: "editor.checkpoint", execute: async () => { throw new Error("private payload secret"); } }, { id: "capture.open", execute: () => false }]);
    expect(await executeCommand("editor.checkpoint", context, vi.fn())).toBe(false);
    expect(await executeCommand("capture.open", context, vi.fn())).toBe(false);
    expect(log.mock.calls.flat().join(" ")).not.toContain("private payload");
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"outcome":"failure"'));
    dispose();
  });
});
