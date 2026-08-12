import { describe, expect, it } from "vitest";
import { activeCommands, commandRegistry } from "@/lib/commands/registry";

describe("command registry capability gating", () => {
  it("activates only verified Sub-gate 0-1 commands", () => {
    expect(activeCommands().map((command) => command.id)).toEqual(["command.palette", "editor.focus"]);
    expect(commandRegistry.filter((command) => command.availability === "reserved").every((command) => command.ownerSubGate >= 2)).toBe(true);
  });

  it("reserves every Bible shortcut without exposing a dead control", () => {
    expect(commandRegistry.map((command) => command.shortcut)).toEqual([
      "Mod+K", "Mod+Shift+F", "Mod+S", "Mod+Alt+O", "Mod+Alt+M", "Mod+.", "Mod+Shift+Space"
    ]);
    expect(new Set(commandRegistry.map((command) => command.shortcut)).size).toBe(commandRegistry.length);
  });
});
