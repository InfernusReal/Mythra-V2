"use client";

import { useEffect, useState } from "react";

export const SAVE_STATUS_EVENT = "mythra:save-status";

export function SaveIndicator({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  useEffect(() => {
    const update = (event: Event) => setStatus((event as CustomEvent<{ label: string }>).detail.label);
    window.addEventListener(SAVE_STATUS_EVENT, update);
    return () => window.removeEventListener(SAVE_STATUS_EVENT, update);
  }, []);
  return <span className="save-status" role="status">{status}</span>;
}
