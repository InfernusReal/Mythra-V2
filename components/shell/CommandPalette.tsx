"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeMenu } from "./ThemeMenu";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className="command-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Commands <kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><h2 id="command-title">Command palette</h2><button type="button" onClick={() => setOpen(false)}>Close</button></header>
            <ThemeMenu />
          </section>
        </div>
      ) : null}
    </>
  );
}
