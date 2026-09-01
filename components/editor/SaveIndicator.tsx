"use client";

import { useEffect, useRef, useState } from "react";

export const SAVE_STATUS_EVENT = "mythra:save-status";

export function SaveIndicator({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [announcement, setAnnouncement] = useState(initialStatus);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const update = (event: Event) => {
      const label = (event as CustomEvent<{ label: string }>).detail.label;
      setStatus(label);
      if (!/saved|failed|conflict|recovered/iu.test(label)) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setAnnouncement(label);
        // Console trace S15-A11Y-001: throttled save announcement records only the stable status label.
        console.log(JSON.stringify({ level: "info", step: "S15-A11Y-001", event: "accessibility.save_status_announced", status: label }));
      }, 300);
    };
    window.addEventListener(SAVE_STATUS_EVENT, update);
    return () => { window.removeEventListener(SAVE_STATUS_EVENT, update); if (timer.current) clearTimeout(timer.current); };
  }, []);
  return <><span className="save-status">{status}</span><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span></>;
}
