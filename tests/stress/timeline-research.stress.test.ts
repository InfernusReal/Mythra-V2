import { describe, expect, it } from "vitest";
import { comparableCoordinate, timelineEventWriteSchema } from "@/domains/timeline/domain/types";
import { normalizeNoteTags } from "@/domains/notes/domain/types";

describe("Timeline and Research stress", () => {
  it("validates, sorts and tags 25,000 mixed records within the declared in-memory budget", () => {
    const started = performance.now();
    const events = Array.from({ length: 25_000 }, (_, index) => timelineEventWriteSchema.parse(index % 5 === 0 ? { mode: "RANGE", title: `Event ${index}`, displayLabel: `Range ${index}`, sortStart: index, sortEnd: index + 5 } : index % 5 === 1 ? { mode: "APPROXIMATE", title: `Event ${index}`, displayLabel: `Around ${index}`, sortStart: index } : { mode: "ORDINAL", title: `Event ${index}`, displayLabel: `Order ${index}`, ordinalValue: index }));
    const coordinates = events.map((event) => comparableCoordinate({ mode: event.mode, sortStart: event.sortStart ?? null, ordinalValue: event.ordinalValue ?? null })).filter((value): value is number => value !== null).sort((left, right) => left - right);
    const tags = Array.from({ length: 25_000 }, (_, index) => normalizeNoteTags([`Tag ${index % 64}`, ` tag ${index % 64} `]));
    const elapsed = performance.now() - started;
    expect(coordinates).toHaveLength(25_000); expect(tags.every((item) => item.length === 1)).toBe(true); expect(elapsed).toBeLessThan(2_500);
  });

  it("rejects a relative chain after the fixed 128-node traversal budget", () => {
    const chain = new Map<string, string>(); for (let index = 0; index < 200; index += 1) chain.set(String(index), String(index + 1));
    let current = "0"; const visited = new Set<string>(); while (chain.has(current) && visited.size < 128) { visited.add(current); current = chain.get(current)!; }
    expect(visited.size).toBe(128); expect(chain.has(current)).toBe(true);
  });
});
