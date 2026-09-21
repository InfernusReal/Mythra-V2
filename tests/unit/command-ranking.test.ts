import { afterEach, describe, expect, it, vi } from "vitest";
import {
  commandHistoryKey,
  parseCommandHistory,
  rankPaletteItems,
  readCommandHistory,
  recordCommandUse,
} from "@/lib/commands/ranking";
import { activeCommands, type CommandContext } from "@/lib/commands/registry";
import type { SearchResult } from "@/domains/search/domain/types";
import { getMessages } from "@/lib/i18n/messages";

const projectId = "b0000000-0000-4000-8000-000000000001";
const context: CommandContext = {
  projectId,
  chapterId: projectId,
  pathname: "/app/chapters/current",
};
const commandLabel = (command: ReturnType<typeof activeCommands>[number]) =>
  getMessages("en")[command.labelKey];
const result: SearchResult = {
  id: projectId,
  sourceId: projectId,
  sourceKey: `CHAPTER:${projectId}`,
  documentType: "CHAPTER",
  blockId: null,
  title: "Save checkpoint",
  snippet: "Private prose",
  sourceVersion: 1,
  sourceUpdatedAt: "2026-09-05T00:00:00.000Z",
  indexedAt: "2026-09-05T00:00:00.000Z",
  freshness: "CURRENT",
  rank: 1000,
  matchReasons: ["exact"],
  explicitReference: false,
  currentContext: false,
  actions: [{ kind: "PEEK", label: "Peek" }],
  metadata: {},
};
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("shared command/object ranking and private history", () => {
  it("ranks recent objects and commands in the same list regardless of type", () => {
    const recent = [
      { projectId, key: result.sourceKey, usedAt: 20 },
      { projectId, key: "command:editor.checkpoint", usedAt: 10 },
    ];
    expect(
      rankPaletteItems(
        activeCommands(),
        [result],
        "save",
        context,
        recent,
        commandLabel,
      ).map((entry) => entry.key),
    ).toEqual([result.sourceKey, "command:editor.checkpoint"]);
    recent[1]!.usedAt = 30;
    expect(
      rankPaletteItems(
        activeCommands(),
        [result],
        "save",
        context,
        recent,
        commandLabel,
      ).map((entry) => entry.key),
    ).toEqual(["command:editor.checkpoint", result.sourceKey]);
  });
  it("uses context, explicit references, exactness, server score, and stable identity tie-breaks", () => {
    const contextual = {
      ...result,
      sourceKey: `ENTITY:${projectId}`,
      currentContext: true,
      explicitReference: true,
    };
    const ranked = rankPaletteItems(
      activeCommands(),
      [result, contextual],
      "save",
      context,
      [],
      commandLabel,
    );
    expect(ranked.map((entry) => entry.key)).toEqual([
      contextual.sourceKey,
      "command:editor.checkpoint",
      result.sourceKey,
    ]);
    const reversed = rankPaletteItems(
      [...activeCommands()].reverse(),
      [contextual, result],
      "save",
      context,
      [],
      commandLabel,
    );
    expect(reversed).toEqual(ranked);
    expect(
      rankPaletteItems(
        activeCommands(),
        [],
        "peek chapter outline",
        context,
        [],
        commandLabel,
      ).map((entry) => entry.key),
    ).toEqual(["command:structure.outline"]);
    expect(
      rankPaletteItems(
        activeCommands(),
        [],
        "zzzz no match",
        context,
        [],
        commandLabel,
      ),
    ).toEqual([]);
  });
  it("isolates project history and ignores malformed, content-bearing identifiers and extra fields", () => {
    recordCommandUse(projectId, result.sourceKey, 10);
    recordCommandUse(projectId, "command:editor.checkpoint", 20);
    recordCommandUse(projectId, "command:editor.checkpoint", 30);
    recordCommandUse(projectId, "CHAPTER:private prose", 40);
    expect(readCommandHistory()).toHaveLength(2);
    expect(localStorage.getItem(commandHistoryKey)).not.toContain("private");
    expect(
      rankPaletteItems(
        activeCommands(),
        [result],
        "save",
        { ...context, projectId: null },
        readCommandHistory(),
        commandLabel,
      )[0]!.key,
    ).toBe("command:editor.checkpoint");
    expect(
      parseCommandHistory(
        JSON.stringify([
          {
            projectId,
            key: result.sourceKey,
            usedAt: 1,
            selectedText: "secret",
            query: "private",
          },
        ]),
      ),
    ).toEqual([{ projectId, key: result.sourceKey, usedAt: 1 }]);
    for (const raw of [
      "invalid",
      "{}",
      "[null]",
      "[1]",
      "[]".repeat(10001),
      JSON.stringify([
        { projectId: "private", key: "command:editor.focus", usedAt: 1 },
      ]),
      JSON.stringify([{ projectId, key: result.sourceKey, usedAt: -1 }]),
    ])
      expect(parseCommandHistory(raw)).toEqual([]);
    recordCommandUse(projectId, "CAUSAL_RELATION_TYPE:CAUSES", 40);
    expect(readCommandHistory()[0]!.key).toBe("CAUSAL_RELATION_TYPE:CAUSES");
  });
  it("bounds history at 30 records and survives denied storage", () => {
    for (let index = 0; index < 100; index++)
      recordCommandUse(
        projectId,
        `ENTITY:b0000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
        index,
      );
    expect(readCommandHistory()).toHaveLength(30);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() =>
      recordCommandUse(projectId, "command:editor.focus"),
    ).not.toThrow();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readCommandHistory()).toEqual([]);
  });
});
