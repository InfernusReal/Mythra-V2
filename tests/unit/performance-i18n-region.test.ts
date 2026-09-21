import { describe, expect, it } from "vitest";
import { classifyViewport, percentile, performanceBudgets } from "@/lib/performance/budgets";
import { assertQueryBudget } from "@/lib/performance/query-budget";
import { virtualWindow } from "@/lib/performance/virtual-window";
import { directionFor, getMessages, resolveLocale } from "@/lib/i18n/messages";
import { regionCapabilityReport, regionalCapabilities } from "@/lib/regions/capabilities";

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/giu)!.map((value) => Number.parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0]! + .7152 * channels[1]! + .0722 * channels[2]!;
}
function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (lighter! + .05) / (darker! + .05);
}

describe("S15 bounded production contracts", () => {
  it("classifies exact responsive boundaries and calculates deterministic percentiles", () => {
    expect([classifyViewport(0), classifyViewport(767), classifyViewport(768), classifyViewport(1279), classifyViewport(1280)]).toEqual(["mobile", "mobile", "compact", "compact", "wide"]);
    expect(percentile([100, 20, 40, 60, 80], 0.95)).toBe(100);
    expect(() => classifyViewport(-1)).toThrow();
    expect(() => percentile([], 0.95)).toThrow();
  });

  it("bounds a million-row logical collection at the start, middle, and end", () => {
    for (const scrollTop of [0, 72_000_000, Number.MAX_SAFE_INTEGER]) {
      const window = virtualWindow({ itemCount: 1_000_000, rowHeight: 144, viewportHeight: 720, scrollTop });
      expect(window.rendered).toBeLessThanOrEqual(performanceBudgets.maxRenderedListItems);
      expect(window.start).toBeGreaterThanOrEqual(0);
      expect(window.end).toBeLessThanOrEqual(1_000_000);
      expect(window.totalHeight).toBe(144_000_000);
    }
  });

  it("fails a query plan that exceeds its declared bound", () => {
    expect(assertQueryBudget("editor.activeChapter", 1, 1)).toEqual({ operation: "editor.activeChapter", observed: 1, maximum: 1 });
    expect(() => assertQueryBudget("universe.page", 3, 2)).toThrow("3/2");
  });

  it("resolves locale direction, long Arabic resources, and English fallback", () => {
    expect(resolveLocale("ar-PK,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(directionFor("ar")).toBe("rtl");
    expect(getMessages("ar").commandPalette.length).toBeGreaterThan(getMessages("en").commandPalette.length);
    expect(getMessages("unsupported")).toBe(getMessages("en"));
  });

  it("keeps regional readiness exhaustive and makes no China compliance claim", () => {
    const global = regionCapabilityReport("global");
    const china = regionCapabilityReport("china");
    expect(Object.keys(global.capabilities).sort()).toEqual([...regionalCapabilities].sort());
    expect(global.capabilities.futureAi).toBe("UNAVAILABLE");
    expect(Object.values(china.capabilities)).not.toContain("AVAILABLE");
    expect(china.complianceClaimed).toBe(false);
  });

  it("keeps primary and muted text tokens above the WCAG AA normal-text ratio in every selectable theme", () => {
    const themes = [
      { background: "#ffffff", text: "#17181c", muted: "#6a6f78" },
      { background: "#181a1d", text: "#f2f3f5", muted: "#9da2aa" },
      { background: "#fbf6eb", text: "#27231d", muted: "#766e62" }
    ];
    for (const theme of themes) {
      expect(contrast(theme.text, theme.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.muted, theme.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
