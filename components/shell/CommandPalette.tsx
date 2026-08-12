"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeMenu } from "./ThemeMenu";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openPalette = () => {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocusRef.current = activeElement && activeElement !== document.body ? activeElement : triggerRef.current;
    setOpen(true);
    // Console trace S1-COMMAND-001: command palette opened; editor selection and content are excluded.
    console.log(JSON.stringify({ level: "info", step: "S1-COMMAND-001", event: "command_palette.opened" }));
  };
  const closePalette = () => {
    setOpen(false);
    returnFocusRef.current?.focus();
    // Console trace S1-COMMAND-002: command palette closed and prior focus restoration was requested.
    console.log(JSON.stringify({ level: "info", step: "S1-COMMAND-002", event: "command_palette.closed" }));
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape" && open) {
        closePalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className="command-trigger" type="button" onClick={openPalette} aria-haspopup="dialog">
        Commands <kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={closePalette}>
          <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><h2 id="command-title">Command palette</h2><button type="button" onClick={closePalette}>Close</button></header>
            <ThemeMenu />
          </section>
        </div>
      ) : null}
    </>
  );
}
