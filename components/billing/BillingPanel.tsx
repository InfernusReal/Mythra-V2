"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useState } from "react";
import { clientTrace } from "@/lib/observability/client-trace";
import type {
  EntitlementSnapshot,
  UsageResource,
} from "@/domains/billing/domain/types";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

interface PublicPlan {
  key: "core" | "intelligence";
  name: string;
  amountUsdCents: number;
  interval: "month";
  availability: "SELLABLE" | "FUTURE_ONLY";
}
interface InvoiceItem {
  id: string;
  status: string;
  amountUsdCents: number;
  issuedAt: string;
  invoiceUrl: string | null;
}
export interface BillingPanelState {
  catalog: PublicPlan[];
  entitlements: EntitlementSnapshot;
  invoices: readonly InvoiceItem[];
  providerAvailable: boolean;
  portalAvailable: boolean;
  cancelAtPeriodEnd: boolean;
}

export function BillingPanel({
  initialState,
}: {
  initialState: BillingPanelState;
}) {
  const { messages, locale } = useLocale();
  const resourceLabels: Readonly<Record<UsageResource, string>> = {
    binaryStorageBytes: messages.usageBinaryStorage,
    snapshotBytes: messages.usageProjectSnapshots,
    revisionStorageBytes: messages.usageRevisionStorage,
    exportGenerationBytes: messages.usageExportGeneration,
    databaseRows: messages.usageStructuredRows,
    bandwidthBytes: messages.usageTransferBandwidth,
    futureAiUnits: messages.usageFutureIntelligence,
  };
  const formattedAmount = (cents: number) =>
    formatCurrency(locale, cents, "USD");
  const formattedUsage = (resource: UsageResource, value: number) =>
    resource === "databaseRows" || resource === "futureAiUnits"
      ? formatNumber(locale, value)
      : formatBytes(locale, value);
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const [message, setMessage] = useState(
    initialState.providerAvailable
      ? ""
      : messages.billingProviderTemporarilyUnavailable,
  );
  const core = initialState.catalog.find((plan) => plan.key === "core")!;
  const intelligence = initialState.catalog.find(
    (plan) => plan.key === "intelligence",
  )!;

  async function begin(action: "checkout" | "portal") {
    setPending(action);
    setMessage("");
    // Console trace S14-UI-001: author-initiated billing action records action and plan only.
    clientTrace("billing.ui_action_started", {
      step: "S14-UI-001",
      action,
      planKey: "core",
    });
    try {
      const response = await fetch(`/api/v2/billing/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body:
          action === "checkout"
            ? JSON.stringify({
                planKey: "core",
                idempotencyKey: crypto.randomUUID(),
              })
            : undefined,
      });
      const payload = (await response.json()) as {
        data?: { checkoutUrl?: string; portalUrl?: string };
        error?: { message: string };
      };
      if (!response.ok)
        throw new Error(
          localizedErrorMessage(
            messages,
            payload.error,
            messages.billingIsTemporarilyUnavailableWritingRemainsAvailable,
          ),
        );
      const destination = payload.data?.checkoutUrl ?? payload.data?.portalUrl;
      if (!destination)
        throw new Error(messages.billingDestinationIsUnavailable);
      // Console trace S14-UI-002: verified billing navigation records action completion without destination or provider identifiers.
      clientTrace("billing.ui_action_completed", {
        step: "S14-UI-002",
        action,
        planKey: "core",
      });
      window.location.assign(destination);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : messages.billingIsTemporarilyUnavailableWritingRemainsAvailable,
      );
      // Console trace S14-UI-003: billing UI failure records stable interaction state and no provider response body.
      clientTrace("billing.ui_action_failed", {
        step: "S14-UI-003",
        action,
        planKey: "core",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="billing-panel" aria-labelledby="billing-heading">
      <header>
        <div>
          <p className="eyebrow">{messages.planAndUsage}</p>
          <h1 id="billing-heading">{messages.mythraCore}</h1>
          <p>
            {
              messages.fullDeterministicMythraV2AccessLimitsFollowMeasuredInfrastructureCostNeverProse
            }
          </p>
        </div>
        <strong>
          {formattedAmount(core.amountUsdCents)}/{messages.monthlyInterval}
        </strong>
      </header>
      <div className="billing-status" aria-label={messages.subscriptionStatus}>
        <span>{messages.status}</span>
        <strong>
          {localizedEnumLabel(
            messages,
            initialState.entitlements.subscriptionStatus,
          )}
        </strong>
        {initialState.cancelAtPeriodEnd ? (
          <span>{messages.accessContinuesThroughThePaidPeriod}</span>
        ) : null}
      </div>
      <div className="billing-actions">
        <button
          type="button"
          onClick={() => void begin("checkout")}
          disabled={pending !== null}
        >
          {pending === "checkout"
            ? messages.openingSecureCheckout
            : messages.chooseCore}
        </button>
        <button
          type="button"
          onClick={() => void begin("portal")}
          disabled={pending !== null || !initialState.portalAvailable}
        >
          {pending === "portal"
            ? messages.openingProviderPortal
            : messages.manageBillingAndInvoices}
        </button>
        <a href="/app">{messages.returnToWriting}</a>
      </div>
      <p className="billing-message" role="status" aria-live="polite">
        {message}
      </p>
      <section aria-labelledby="usage-heading">
        <h2 id="usage-heading">{messages.transparentUsage}</h2>
        <ul className="usage-list">
          {Object.entries(initialState.entitlements.usage).map(
            ([key, used]) => {
              const resource = key as UsageResource;
              const limit = initialState.entitlements.limits[resource];
              return (
                <li key={resource}>
                  <div>
                    <strong>{resourceLabels[resource]}</strong>
                    <span>
                      {formattedUsage(resource, used)} {messages.of}{" "}
                      {formattedUsage(resource, limit)}
                    </span>
                  </div>
                  <progress
                    aria-label={interpolateMessage(messages.resourceUsage, {
                      resource: resourceLabels[resource],
                    })}
                    max={Math.max(1, limit)}
                    value={Math.min(used, limit)}
                  />
                </li>
              );
            },
          )}
        </ul>
        <p>
          {messages.ownedWorkStaysReadableAndExportableIfACostLimitIsReached}
        </p>
      </section>
      <section className="future-plan" aria-labelledby="future-heading">
        <h2 id="future-heading">
          {localizedEnumLabel(messages, intelligence.key)}
        </h2>
        <p>
          {formattedAmount(intelligence.amountUsdCents)}
          {messages.monthIsReservedForAFutureAiProductItIsNotAvailable}
        </p>
        <button type="button" disabled>
          {messages.futureOnly}
        </button>
      </section>
      {initialState.invoices.length ? (
        <section aria-labelledby="invoices-heading">
          <h2 id="invoices-heading">{messages.invoices}</h2>
          <ul>
            {initialState.invoices.map((invoice) => (
              <li key={invoice.id}>
                <span>
                  {formatDate(locale, new Date(invoice.issuedAt))} ·{" "}
                  {localizedEnumLabel(messages, invoice.status)} ·{" "}
                  {formattedAmount(invoice.amountUsdCents)}
                </span>
                {invoice.invoiceUrl ? (
                  <a href={invoice.invoiceUrl}>{messages.openInvoice}</a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
