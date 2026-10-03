import { useLayoutEffect, useRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";

function AtFirstCommit({ initialKey, shift, close }: { initialKey?: string; shift?: boolean; close: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useModalKeyboard(ref, true, close);
  useLayoutEffect(() => {
    const first = ref.current!.querySelector("textarea")!; first.focus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: initialKey ?? "Tab", shiftKey: shift, bubbles: true, cancelable: true }));
  }, [initialKey, shift]);
  return <section ref={ref} role="dialog" aria-modal="true"><textarea aria-label="Thought" /><button>Return to Chapter</button></section>;
}

describe("modal keyboard readiness before passive effects", () => {
  it("contains Shift+Tab from the initial Capture field on the first visible commit", () => {
    render(<AtFirstCommit shift close={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Return to Chapter" })).toHaveFocus();
  });
  it("owns Escape from the initial Capture field on the first visible commit", () => {
    const close = vi.fn(); render(<AtFirstCommit initialKey="Escape" close={close} />);
    expect(close).toHaveBeenCalledOnce();
  });
});
