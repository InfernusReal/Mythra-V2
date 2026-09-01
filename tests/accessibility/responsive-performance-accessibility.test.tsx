import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileWritingActions } from "@/components/editor/MobileWritingActions";
import { VirtualList } from "@/components/performance/VirtualList";
import { MobileNavigationSheet } from "@/components/shell/MobileNavigationSheet";

describe("S15 responsive accessibility", () => {
  it("has no serious or critical violation in the mobile writing and navigation controls", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { container } = render(<><MobileWritingActions projectId="project-1" chapterId="chapter-1" /><MobileNavigationSheet /></>);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });

  it("has no serious or critical violation in the virtualized semantic list", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const items = Array.from({ length: 1_000 }, (_, index) => ({ id: `object-${index}` }));
    const { container } = render(<main><h1>Objects</h1><VirtualList items={items} getKey={(item) => item.id} label="Project objects" renderItem={(item) => <a href={`#${item.id}`}>{item.id}</a>} /></main>);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
