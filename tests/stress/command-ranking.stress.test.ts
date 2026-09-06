import { describe, expect, it } from "vitest";
import { activeCommands } from "@/lib/commands/registry";
import { rankPaletteItems } from "@/lib/commands/ranking";
import type { SearchResult } from "@/domains/search/domain/types";

describe("S18 bounded mixed ranking stress", () => {
  it("keeps 500 repeated 100-object rankings stable without mutating source objects", () => {
    const projectId = "b0000000-0000-4000-8000-000000000001";
    const results: SearchResult[] = Array.from({ length: 100 }, (_, index) => ({ id: String(index), sourceId: String(index), sourceKey: `ENTITY:b0000000-0000-4000-8000-${index.toString().padStart(12, "0")}`, documentType: "ENTITY", blockId: null, title: "Synthetic ranking fixture", snippet: "", sourceVersion: 1, sourceUpdatedAt: "2026-09-05T00:00:00Z", indexedAt: "2026-09-05T00:00:00Z", freshness: "CURRENT", rank: index % 7, currentContext: index % 2 === 0, explicitReference: index % 3 === 0, matchReasons: [], actions: [], metadata: {} }));
    const original = JSON.stringify(results);
    const context = { projectId, chapterId: projectId, pathname: "/app/chapters/current" };
    const recent = results.slice(0, 30).map((result, index) => ({ projectId, key: result.sourceKey, usedAt: index % 5 }));
    const expected = rankPaletteItems(activeCommands(), results, "", context, recent).map((item) => item.key);
    const startedAt = performance.now();
    for (let run = 0; run < 500; run++) {
      const offset = run % results.length;
      const rotated = [...results.slice(offset), ...results.slice(0, offset)];
      expect(rankPaletteItems([...activeCommands()].reverse(), rotated, "", context, [...recent].reverse()).map((item) => item.key)).toEqual(expected);
    }
    expect(JSON.stringify(results)).toBe(original);
    expect(new Set(expected).size).toBe(expected.length);
    // Console trace S18-STRESS-001: deterministic mixed-ranking stress records counts and duration, never authored or query text.
    console.log(JSON.stringify({ level: "info", step: "S18-STRESS-001", event: "commands.ranking_stress_verified", iterations: 500, objectCount: results.length, commandCount: activeCommands().length, durationMs: Math.round(performance.now() - startedAt) }));
  });
});
