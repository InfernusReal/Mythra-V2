"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordClientOperationalEvent } from "@/lib/observability/client-operations";

const uuidSegment = /^[0-9a-f]{8}-[0-9a-f-]{27}$/iu;

export function normalizedRouteKey(pathname: string | null): string {
  return pathname?.split("/").map((segment) => uuidSegment.test(segment) ? ":id" : segment).join("/") || "/";
}

export function NavigationAnalytics() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const routeKey = normalizedRouteKey(pathname);
    if (previous.current === routeKey) return;
    const source = previous.current === null ? "entry" : "client";
    previous.current = routeKey;
    recordClientOperationalEvent({ eventName: "navigation.route_changed", routeKey, dimensions: { source } });
    // Console trace S16-FRICTION-006: route-change analytics records only a normalized route template and navigation source.
    console.log(JSON.stringify({ level: "info", step: "S16-FRICTION-006", event: "friction.route_changed", routeKey, source }));
  }, [pathname]);
  return null;
}
