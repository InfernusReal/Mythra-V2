"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AdminOperationsSnapshot } from "@/domains/operations/application/ports";
import { RecoveryActionControl } from "./RecoveryActionControl";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  localizedEnumLabel,
  localizedEnumLabelOrValue,
} from "@/lib/i18n/messages";

export function AdminOperationsPanel({
  snapshot,
  recoveryEnabled = false,
}: {
  snapshot: AdminOperationsSnapshot;
  recoveryEnabled?: boolean;
}) {
  const { messages, locale } = useLocale();
  const dateTime = (value: string) => formatDateTime(locale, new Date(value));
  return (
    <section className="admin-panel" aria-labelledby="admin-title">
      <header>
        <p className="eyebrow">{messages.restrictedOperations}</p>
        <h1 id="admin-title">{messages.workspaceOperations}</h1>
        <p>
          {
            messages.contentSafeOperationalMetadataOnlyManuscriptsWorldDataNotesCapturesSearchTerms
          }
        </p>
      </header>
      <dl>
        <div>
          <dt>{messages.operator}</dt>
          <dd>
            {snapshot.actor.userId} (
            {localizedEnumLabel(messages, snapshot.actor.role)})
          </dd>
        </div>
        <div>
          <dt>{messages.workspace}</dt>
          <dd>{snapshot.workspace.id}</dd>
        </div>
        <div>
          <dt>{messages.plan}</dt>
          <dd>
            {localizedEnumLabel(
              messages,
              snapshot.subscription?.planKey ?? snapshot.workspace.planKey,
            )}
          </dd>
        </div>
        <div>
          <dt>{messages.status}</dt>
          <dd>
            {snapshot.subscription
              ? localizedEnumLabel(messages, snapshot.subscription.status)
              : messages.noSubscription}
          </dd>
        </div>
        <div>
          <dt>{messages.members}</dt>
          <dd>{formatNumber(locale, snapshot.workspace.memberCount)}</dd>
        </div>
        <div>
          <dt>{messages.projects}</dt>
          <dd>{formatNumber(locale, snapshot.workspace.projectCount)}</dd>
        </div>
      </dl>
      <h2>{messages.usage}</h2>
      <ul>
        {snapshot.quotas.map((item) => (
          <li key={item.resource}>
            {localizedEnumLabel(messages, item.resource)}:{" "}
            {formatNumber(locale, item.quantity)}
          </li>
        ))}
      </ul>
      <h2>{messages.jobs}</h2>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={messages.operationalJobs}
      >
        <table>
          <thead>
            <tr>
              <th>{messages.type}</th>
              <th>{messages.status}</th>
              <th>{messages.attempts}</th>
              <th>{messages.error}</th>
              <th>{messages.created}</th>
              <th>{messages.recovery}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.jobs.map((job) => (
              <tr key={job.id}>
                <td>{localizedEnumLabelOrValue(messages, job.jobType)}</td>
                <td>{localizedEnumLabel(messages, job.status)}</td>
                <td>{formatNumber(locale, job.attempts)}</td>
                <td>
                  {job.errorCode
                    ? localizedEnumLabelOrValue(messages, job.errorCode)
                    : messages.none}
                </td>
                <td>{dateTime(job.createdAt)}</td>
                <td>
                  {recoveryEnabled && job.status === "FAILED" ? (
                    <RecoveryActionControl targetId={job.id} />
                  ) : (
                    messages.unavailable
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{messages.exports}</h2>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={messages.exportJobs}
      >
        <table>
          <thead>
            <tr>
              <th>{messages.format}</th>
              <th>{messages.scope}</th>
              <th>{messages.status}</th>
              <th>{messages.bytes}</th>
              <th>{messages.created}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.exports.map((item) => (
              <tr key={item.id}>
                <td>{localizedEnumLabel(messages, item.format)}</td>
                <td>{localizedEnumLabel(messages, item.scope)}</td>
                <td>{localizedEnumLabel(messages, item.status)}</td>
                <td>
                  {item.sizeBytes === null
                    ? messages.pending
                    : formatBytes(locale, item.sizeBytes)}
                </td>
                <td>{dateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{messages.snapshots}</h2>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={messages.snapshotJobs}
      >
        <table>
          <thead>
            <tr>
              <th>{messages.status}</th>
              <th>{messages.bytes}</th>
              <th>{messages.requested}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.snapshots.map((item) => (
              <tr key={item.id}>
                <td>{localizedEnumLabel(messages, item.status)}</td>
                <td>
                  {item.sizeBytes === null
                    ? messages.pending
                    : formatBytes(locale, item.sizeBytes)}
                </td>
                <td>{dateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{messages.alerts}</h2>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={messages.operationalAlerts}
      >
        <table>
          <thead>
            <tr>
              <th>{messages.rule}</th>
              <th>{messages.status}</th>
              <th>{messages.observed}</th>
              <th>{messages.severity}</th>
              <th>{messages.runbook}</th>
              <th>{messages.evaluated}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.alerts.map((alert) => (
              <tr key={alert.key}>
                <td>{localizedEnumLabelOrValue(messages, alert.key)}</td>
                <td>{localizedEnumLabel(messages, alert.state)}</td>
                <td>{formatNumber(locale, alert.observed)}</td>
                <td>{localizedEnumLabel(messages, alert.severity)}</td>
                <td>{alert.runbook}</td>
                <td>{dateTime(alert.evaluatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{messages.nonContentAudit}</h2>
      <ul>
        {snapshot.audits.map((audit) => (
          <li key={audit.id}>
            {localizedEnumLabelOrValue(messages, audit.kind)} /{" "}
            {localizedEnumLabelOrValue(messages, audit.targetType)} /{" "}
            {dateTime(audit.createdAt)}
          </li>
        ))}
      </ul>
      <h2>{messages.operationalEvents}</h2>
      <ul>
        {snapshot.operations.map((event, index) => (
          <li key={`${event.eventName}-${event.occurredAt}-${index}`}>
            {localizedEnumLabelOrValue(messages, event.eventName)} /{" "}
            {dateTime(event.occurredAt)}
          </li>
        ))}
      </ul>
    </section>
  );
}
