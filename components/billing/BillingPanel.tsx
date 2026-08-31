"use client";

import { useState } from "react";
import { clientTrace } from "@/lib/observability/client-trace";
import type { EntitlementSnapshot, UsageResource } from "@/domains/billing/domain/types";

interface PublicPlan { key: "core" | "intelligence"; name: string; amountUsdCents: number; interval: "month"; availability: "SELLABLE" | "FUTURE_ONLY" }
interface InvoiceItem { id: string; status: string; amountUsdCents: number; issuedAt: string; invoiceUrl: string | null }
export interface BillingPanelState { catalog: PublicPlan[]; entitlements: EntitlementSnapshot; invoices: readonly InvoiceItem[]; providerAvailable: boolean; portalAvailable: boolean; cancelAtPeriodEnd: boolean }

const resourceLabels: Readonly<Record<UsageResource, string>> = {
  binaryStorageBytes: "Binary storage",
  snapshotBytes: "Project snapshots",
  revisionStorageBytes: "Revision storage",
  exportGenerationBytes: "Export generation",
  databaseRows: "Structured rows",
  bandwidthBytes: "Transfer bandwidth",
  futureAiUnits: "Future Intelligence"
};

function formattedAmount(cents: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100); }
function formattedUsage(resource: UsageResource, value: number): string { return resource === "databaseRows" || resource === "futureAiUnits" ? new Intl.NumberFormat().format(value) : `${(value / 1024 / 1024).toFixed(value ? 1 : 0)} MB`; }

export function BillingPanel({ initialState }: { initialState: BillingPanelState }) {
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const [message, setMessage] = useState(initialState.providerAvailable ? "" : "Billing provider details are temporarily unavailable. Writing and owned exports remain available.");
  const core = initialState.catalog.find((plan) => plan.key === "core")!;
  const intelligence = initialState.catalog.find((plan) => plan.key === "intelligence")!;

  async function begin(action: "checkout" | "portal") {
    setPending(action);
    setMessage("");
    // Console trace S14-UI-001: author-initiated billing action records action and plan only.
    clientTrace("billing.ui_action_started", { step: "S14-UI-001", action, planKey: "core" });
    try {
      const response = await fetch(`/api/v2/billing/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: action === "checkout" ? JSON.stringify({ planKey: "core", idempotencyKey: crypto.randomUUID() }) : undefined });
      const payload = await response.json() as { data?: { checkoutUrl?: string; portalUrl?: string }; error?: { message: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Billing is temporarily unavailable.");
      const destination = payload.data?.checkoutUrl ?? payload.data?.portalUrl;
      if (!destination) throw new Error("Billing destination is unavailable.");
      // Console trace S14-UI-002: verified billing navigation records action completion without destination or provider identifiers.
      clientTrace("billing.ui_action_completed", { step: "S14-UI-002", action, planKey: "core" });
      window.location.assign(destination);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Billing is temporarily unavailable. Writing remains available.");
      // Console trace S14-UI-003: billing UI failure records stable interaction state and no provider response body.
      clientTrace("billing.ui_action_failed", { step: "S14-UI-003", action, planKey: "core" });
    } finally { setPending(null); }
  }

  return (
    <section className="billing-panel" aria-labelledby="billing-heading">
      <header><div><p className="eyebrow">Plan and usage</p><h1 id="billing-heading">Mythra Core</h1><p>Full deterministic Mythra V2 access. Limits follow measured infrastructure cost, never prose length.</p></div><strong>{formattedAmount(core.amountUsdCents)}/{core.interval}</strong></header>
      <div className="billing-status" aria-label="Subscription status"><span>Status</span><strong>{initialState.entitlements.subscriptionStatus.replace("_", " ")}</strong>{initialState.cancelAtPeriodEnd ? <span>Access continues through the paid period.</span> : null}</div>
      <div className="billing-actions">
        <button type="button" onClick={() => void begin("checkout")} disabled={pending !== null}>{pending === "checkout" ? "Opening secure checkout" : "Choose Core"}</button>
        <button type="button" onClick={() => void begin("portal")} disabled={pending !== null || !initialState.portalAvailable}>{pending === "portal" ? "Opening provider portal" : "Manage billing and invoices"}</button>
        <a href="/app">Return to writing</a>
      </div>
      <p className="billing-message" role="status" aria-live="polite">{message}</p>
      <section aria-labelledby="usage-heading"><h2 id="usage-heading">Transparent usage</h2><ul className="usage-list">{Object.entries(initialState.entitlements.usage).map(([key, used]) => { const resource = key as UsageResource; const limit = initialState.entitlements.limits[resource]; return <li key={resource}><div><strong>{resourceLabels[resource]}</strong><span>{formattedUsage(resource, used)} of {formattedUsage(resource, limit)}</span></div><progress aria-label={`${resourceLabels[resource]} usage`} max={Math.max(1, limit)} value={Math.min(used, limit)} /></li>; })}</ul><p>Owned work stays readable and exportable if a cost limit is reached or billing changes.</p></section>
      <section className="future-plan" aria-labelledby="future-heading"><h2 id="future-heading">{intelligence.name}</h2><p>{formattedAmount(intelligence.amountUsdCents)}/month is reserved for a future AI product. It is not available, active, or charged in V2.</p><button type="button" disabled>Future only</button></section>
      {initialState.invoices.length ? <section aria-labelledby="invoices-heading"><h2 id="invoices-heading">Invoices</h2><ul>{initialState.invoices.map((invoice) => <li key={invoice.id}><span>{new Date(invoice.issuedAt).toLocaleDateString()} · {invoice.status} · {formattedAmount(invoice.amountUsdCents)}</span>{invoice.invoiceUrl ? <a href={invoice.invoiceUrl}>Open invoice</a> : null}</li>)}</ul></section> : null}
    </section>
  );
}
