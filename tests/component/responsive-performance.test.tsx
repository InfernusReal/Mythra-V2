import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileWritingActions } from "@/components/editor/MobileWritingActions";
import { SaveIndicator, SAVE_STATUS_EVENT } from "@/components/editor/SaveIndicator";
import { VirtualList } from "@/components/performance/VirtualList";
import { MobileNavigationSheet } from "@/components/shell/MobileNavigationSheet";
import { MOBILE_WRITING_ACTION } from "@/lib/editor/mobile-actions";

afterEach(() => vi.useRealTimers());

describe("S15 responsive and accessible primitives", () => {
  it("dispatches every mobile writing action without exposing authored content", () => {
    const received: string[] = [];
    const listener = (event: Event) => received.push((event as CustomEvent<string>).detail);
    window.addEventListener(MOBILE_WRITING_ACTION, listener);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<MobileWritingActions projectId="project-1" chapterId="chapter-1" />);
    for (const name of ["Capture", "Search", "Context", "Entity"]) fireEvent.click(screen.getByRole("button", { name }));
    expect(received).toEqual(["capture", "search", "context", "entity"]);
    expect(screen.getByRole("link", { name: "Outline" })).toHaveAttribute("href", "/app/projects/project-1/structure?returnChapterId=chapter-1");
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain("manuscript");
    window.removeEventListener(MOBILE_WRITING_ACTION, listener);
  });

  it("mounts only a bounded accessible window for a dense collection", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const items = Array.from({ length: 10_000 }, (_, index) => ({ id: `item-${index}` }));
    render(<VirtualList items={items} getKey={(item) => item.id} label="Dense test objects" rowHeight={40} viewportHeight={400} renderItem={(item) => <span>{item.id}</span>} />);
    const region = screen.getByRole("region", { name: "Dense test objects" });
    expect(screen.getAllByRole("listitem").length).toBeLessThanOrEqual(80);
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("aria-setsize", "10000");
    fireEvent.scroll(region, { target: { scrollTop: 200_000 } });
    expect(screen.getAllByRole("listitem").length).toBeLessThanOrEqual(80);
  });

  it("restores focus when the mobile navigation sheet closes", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<MobileNavigationSheet />);
    const trigger = screen.getByRole("button", { name: "Navigation" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    const settings = screen.getByRole("link", { name: "Settings" });
    settings.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Return" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("coalesces save announcements and does not announce transient typing state", () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<SaveIndicator initialStatus="Saved" />);
    act(() => window.dispatchEvent(new CustomEvent(SAVE_STATUS_EVENT, { detail: { label: "Saving" } })));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    act(() => window.dispatchEvent(new CustomEvent(SAVE_STATUS_EVENT, { detail: { label: "Saved" } })));
    act(() => vi.advanceTimersByTime(299));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("S15-A11Y-001"));
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("S15-A11Y-001"));
  });
});
