"use client";

import { useEffect } from "react";
import { useNetworkStatus } from "@/lib/offline/use-network-status";

export function DegradedNetworkStatus() {
  const online = useNetworkStatus();
  useEffect(() => {
    // Console trace S11-OFFLINE-003: network capability transition records availability only and excludes route/content.
    console.log(JSON.stringify({ level: "info", step: "S11-OFFLINE-003", event: "network.capability_state_changed", online }));
  }, [online]);
  if (online) return null;
  return <aside className="degraded-network" role="status" aria-live="polite">
    <strong>Offline limited mode.</strong> Manuscript writing remains local and Capture remains queued. Search is limited to recently cached chapters; cached context is marked stale. Structure changes, export, snapshots, and billing are unavailable until the server returns.
  </aside>;
}
