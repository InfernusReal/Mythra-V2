import {
  activeSearchDocumentTypes,
  normalizeSearchText,
  type SearchResult,
} from "@/domains/search/domain/types";
import {
  commandRegistry,
  type CommandContext,
  type MythraCommand,
} from "./registry";
import { causalRelationTypes } from "@/domains/causality/domain/types";

export const commandHistoryKey = "mythra.commands.recent.v2";
export interface RecentCommandEntry {
  projectId: string | null;
  key: string;
  usedAt: number;
}
export type PaletteItem =
  | { kind: "command"; key: string; command: MythraCommand }
  | { kind: "object"; key: string; result: SearchResult };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function validKey(key: string): boolean {
  if (key.startsWith("command:"))
    return commandRegistry.some((entry) => `command:${entry.id}` === key);
  const [type, id, block, ...extra] = key.split(":");
  if (type === "CAUSAL_RELATION_TYPE")
    return (
      extra.length === 0 &&
      block === undefined &&
      causalRelationTypes.some((entry) => entry === id)
    );
  return (
    extra.length === 0 &&
    activeSearchDocumentTypes.some((entry) => entry === type) &&
    uuid.test(id ?? "") &&
    (!block || uuid.test(block))
  );
}

export function parseCommandHistory(raw: string | null): RecentCommandEntry[] {
  if (raw && raw.length > 20_000) return [];
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((entry: unknown) => {
        if (!entry || typeof entry !== "object") return [];
        const value = entry as Partial<RecentCommandEntry>;
        if (
          !(
            value.projectId === null ||
            (typeof value.projectId === "string" && uuid.test(value.projectId))
          ) ||
          typeof value.key !== "string" ||
          !validKey(value.key) ||
          typeof value.usedAt !== "number" ||
          !Number.isSafeInteger(value.usedAt) ||
          value.usedAt < 0
        )
          return [];
        // Rebuild an allowlisted record; never retain unexpected localStorage fields.
        return [
          { projectId: value.projectId, key: value.key, usedAt: value.usedAt },
        ];
      })
      .sort((a, b) => b.usedAt - a.usedAt || compareKey(a.key, b.key))
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function readCommandHistory(): RecentCommandEntry[] {
  try {
    return parseCommandHistory(localStorage.getItem(commandHistoryKey));
  } catch {
    return [];
  }
}

export function recordCommandUse(
  projectId: string | null,
  key: string,
  now = Date.now(),
): void {
  const current = readCommandHistory().filter(
    (entry) => entry.projectId !== projectId || entry.key !== key,
  );
  const safe = parseCommandHistory(
    JSON.stringify([{ projectId, key, usedAt: now }, ...current]),
  );
  try {
    localStorage.setItem(commandHistoryKey, JSON.stringify(safe));
  } catch {
    /* Storage denial must not prevent the action or writing return. */
  }
}

const compareKey = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

export function rankPaletteItems(
  commands: readonly MythraCommand[],
  results: readonly SearchResult[],
  query: string,
  context: CommandContext,
  recent: readonly RecentCommandEntry[],
  commandLabel: (command: MythraCommand) => string,
): PaletteItem[] {
  const normalized = normalizeSearchText(query);
  const matching = commands.filter((entry) =>
    normalized
      .split(" ")
      .every((token) =>
        normalizeSearchText(commandLabel(entry)).includes(token),
      ),
  );
  const items: PaletteItem[] = [
    ...matching.map((command): PaletteItem => ({
      kind: "command",
      key: `command:${command.id}`,
      command,
    })),
    ...results.map((result): PaletteItem => ({
      kind: "object",
      key: result.sourceKey,
      result,
    })),
  ];
  const recentByKey = new Map<string, number>();
  for (const entry of recent)
    if (entry.projectId === context.projectId)
      recentByKey.set(
        entry.key,
        Math.max(entry.usedAt, recentByKey.get(entry.key) ?? 0),
      );
  const contextRank = (item: PaletteItem) =>
    item.kind === "object"
      ? Number(item.result.currentContext) * 2 +
        Number(item.result.explicitReference)
      : item.command.scope === "chapter"
        ? 3
        : item.command.surface &&
            context.pathname.endsWith(`/${item.command.surface}`)
          ? 2
          : Number(item.command.scope === "project");
  const exact = (item: PaletteItem) =>
    Number(
      Boolean(normalized) &&
        normalizeSearchText(
          item.kind === "command"
            ? commandLabel(item.command)
            : item.result.title,
        ) === normalized,
    );
  return items.sort(
    (left, right) =>
      (recentByKey.get(right.key) ?? 0) - (recentByKey.get(left.key) ?? 0) ||
      contextRank(right) - contextRank(left) ||
      exact(right) - exact(left) ||
      (right.kind === "object" ? right.result.rank : 0) -
        (left.kind === "object" ? left.result.rank : 0) ||
      compareKey(left.key, right.key),
  );
}
