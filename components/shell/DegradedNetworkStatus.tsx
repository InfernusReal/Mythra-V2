"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";
import { useNetworkStatus } from "@/lib/offline/use-network-status";

export function DegradedNetworkStatus() {
  const { messages } = useLocale();
  const online = useNetworkStatus();
  useEffect(() => {
    // Console trace S11-OFFLINE-003: network capability transition records availability only and excludes route/content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-OFFLINE-003",
        event: "network.capability_state_changed",
        online,
      }),
    );
  }, [online]);
  if (online) return null;
  return (
    <aside className="degraded-network">
      <div role="status">
        <strong>{messages.offlineLimitedMode}</strong>{" "}
        {
          messages.manuscriptWritingRemainsLocalAndCaptureRemainsQueuedSearchIsLimitedTo
        }{" "}
      </div>
    </aside>
  );
}
