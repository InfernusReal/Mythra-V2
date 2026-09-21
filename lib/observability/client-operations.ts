"use client";

import type { z } from "zod";
import type { clientOperationalEventSchema } from "./operations";

type ClientOperationalEvent = z.input<typeof clientOperationalEventSchema>;
export const CLIENT_OPERATIONAL_EVENT = "mythra:operational-event";

export function recordClientOperationalEvent(event: ClientOperationalEvent): void {
  window.dispatchEvent(new CustomEvent(CLIENT_OPERATIONAL_EVENT, { detail: structuredClone(event) }));
  if (process.env.NODE_ENV === "test") return;
  void fetch("/api/v2/operations/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event), keepalive: true }).catch(() => undefined);
}
