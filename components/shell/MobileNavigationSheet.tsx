"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function MobileNavigationSheet() {
  const { messages } = useLocale();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
    // Console trace S15-MOBILE-003: navigation sheet close records focus restoration only.
    console.log(JSON.stringify({ level: "info", step: "S15-MOBILE-003", event: "responsive.navigation_sheet_closed", focusRestored: true }));
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !sheet.current) return;
      const focusable = [...sheet.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close, open]);
  return (
    <>
      <button
        ref={trigger}
        className="mobile-navigation-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          // Console trace S15-MOBILE-002: navigation sheet open records viewport class only and no route content.
          console.log(
            JSON.stringify({
              level: "info",
              step: "S15-MOBILE-002",
              event: "responsive.navigation_sheet_opened",
              viewportClass: "mobile",
            }),
          );
        }}
      >
        <svg
          aria-hidden="true"
          className="mobile-navigation-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span>{messages.navigation}</span>
      </button>
      {open ? (
        <div
          className="mobile-sheet-backdrop"
          role="presentation"
          onMouseDown={close}
        >
          <section
            ref={sheet}
            className="mobile-navigation-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="mobile-navigation-title">{messages.navigation}</h2>
              <button
                autoFocus
                className="mobile-navigation-close"
                type="button"
                onClick={close}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
                <span>{messages.returnAction}</span>
              </button>
            </header>
            <nav aria-label={messages.navigation}>
              <a href="/app">{messages.projects}</a>
              <a href="/app/settings">{messages.settings}</a>
            </nav>
          </section>
        </div>
      ) : null}
    </>
  );
}
