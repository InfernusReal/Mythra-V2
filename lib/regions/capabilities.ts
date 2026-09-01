export const regionalCapabilities = ["payments", "messaging", "storage", "analytics", "futureAi"] as const;
export type RegionalCapability = typeof regionalCapabilities[number];
export type RegionalCapabilityState = "AVAILABLE" | "UNAVAILABLE" | "REQUIRES_VERIFICATION";
export type RegionKey = "global" | "china";

export interface RegionCapabilityReport {
  region: RegionKey;
  capabilities: Readonly<Record<RegionalCapability, RegionalCapabilityState>>;
  complianceClaimed: false;
}

const reports: Readonly<Record<RegionKey, RegionCapabilityReport>> = Object.freeze({
  global: Object.freeze({ region: "global", capabilities: Object.freeze({ payments: "AVAILABLE", messaging: "AVAILABLE", storage: "AVAILABLE", analytics: "AVAILABLE", futureAi: "UNAVAILABLE" }), complianceClaimed: false }),
  china: Object.freeze({ region: "china", capabilities: Object.freeze({ payments: "REQUIRES_VERIFICATION", messaging: "REQUIRES_VERIFICATION", storage: "REQUIRES_VERIFICATION", analytics: "REQUIRES_VERIFICATION", futureAi: "UNAVAILABLE" }), complianceClaimed: false })
});

export function regionCapabilityReport(region: RegionKey): RegionCapabilityReport {
  // Console trace S15-REGION-001: region readiness evaluation records only the stable region key and capability states.
  console.log(JSON.stringify({ level: "info", step: "S15-REGION-001", event: "region.capability_report_resolved", region, capabilities: reports[region].capabilities }));
  return reports[region];
}
