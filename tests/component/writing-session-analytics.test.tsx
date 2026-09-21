import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT_OPERATIONAL_EVENT } from "@/lib/observability/client-operations";
import { markWritingInterruption, useWritingSessionAnalytics } from "@/lib/observability/writing-session";

function Harness({ written }: { written: boolean }) {
  const writtenRef = useRef(written);
  useWritingSessionAnalytics("a873e0d0-e22f-4cd0-a7f9-484546489adc", writtenRef);
  return null;
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("S16 writing-session analytics", () => {
  it("does not emit a writing session before a keystroke", () => {
    const events: unknown[] = [];
    window.addEventListener(CLIENT_OPERATIONAL_EVENT, (event) => events.push((event as CustomEvent).detail), { once: true });
    const view = render(<Harness written={false} />);
    view.unmount();
    expect(events).toEqual([]);
  });

  it("measures interruption-aware UWT and classifies an auxiliary session", () => {
    vi.useFakeTimers();
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const events: Array<{ eventName: string; dimensions?: { outcome?: string } }> = [];
    const listener = (event: Event) => events.push((event as CustomEvent).detail);
    window.addEventListener(CLIENT_OPERATIONAL_EVENT, listener);
    const view = render(<Harness written />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      markWritingInterruption("OPEN", "context");
      markWritingInterruption("OPEN", "context");
      markWritingInterruption("CLOSE", "context");
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new MouseEvent("pointerdown"));
      vi.advanceTimersByTime(60_001);
    });
    view.unmount();
    window.removeEventListener(CLIENT_OPERATIONAL_EVENT, listener);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ eventName: "session.writing", dimensions: { outcome: "interrupted" } });
  });

  it("emits both session and editor-only events when no auxiliary tool opens", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const events: Array<{ eventName: string }> = [];
    const listener = (event: Event) => events.push((event as CustomEvent).detail);
    window.addEventListener(CLIENT_OPERATIONAL_EVENT, listener);
    const view = render(<Harness written />);
    view.unmount();
    window.removeEventListener(CLIENT_OPERATIONAL_EVENT, listener);
    expect(events.map((event) => event.eventName)).toEqual(["session.writing", "session.editor_only"]);
  });
});
