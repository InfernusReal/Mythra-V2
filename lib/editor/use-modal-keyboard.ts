"use client";

import { useLayoutEffect, type RefObject } from "react";

export function modalControls(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')]
    .sort((left, right) => left === right ? 0 : left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
}

/** Keyboard containment belongs to the topmost existing modal, including nested Peek. */
export function useModalKeyboard(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void, canClose = true): void {
  useLayoutEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const dialog = ref.current;
      if (!dialog || event.isComposing || event.keyCode === 229) return;
      if ([...document.querySelectorAll('[aria-modal="true"]')].at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault(); event.stopImmediatePropagation();
        if (canClose) close();
      }
      if (event.key === "Tab") {
        const controls = modalControls(dialog);
        const first = controls[0]; const last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement)) && last) { event.preventDefault(); event.stopImmediatePropagation(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement)) && first) { event.preventDefault(); event.stopImmediatePropagation(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [canClose, close, open, ref]);
}
