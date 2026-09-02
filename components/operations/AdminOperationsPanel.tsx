import type { AdminOperationsSnapshot } from "@/domains/operations/application/ports";
import { RecoveryActionControl } from "./RecoveryActionControl";

export function AdminOperationsPanel({ snapshot, recoveryEnabled = false }: { snapshot: AdminOperationsSnapshot; recoveryEnabled?: boolean }) {
  return <section className="admin-panel" aria-labelledby="admin-title">
    <header><p className="eyebrow">Restricted operations</p><h1 id="admin-title">Workspace operations</h1><p>Content-safe operational metadata only. Manuscripts, world data, notes, Captures, search terms, and uploaded files are not available here.</p></header>
    <dl>
      <div><dt>Operator</dt><dd>{snapshot.actor.userId} ({snapshot.actor.role})</dd></div>
      <div><dt>Workspace</dt><dd>{snapshot.workspace.id}</dd></div>
      <div><dt>Plan</dt><dd>{snapshot.subscription?.planKey ?? snapshot.workspace.planKey}</dd></div>
      <div><dt>Status</dt><dd>{snapshot.subscription?.status ?? "NO_SUBSCRIPTION"}</dd></div>
      <div><dt>Members</dt><dd>{snapshot.workspace.memberCount}</dd></div>
      <div><dt>Projects</dt><dd>{snapshot.workspace.projectCount}</dd></div>
    </dl>
    <h2>Usage</h2><ul>{snapshot.quotas.map((item) => <li key={item.resource}>{item.resource}: {item.quantity}</li>)}</ul>
    <h2>Jobs</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Operational jobs"><table><thead><tr><th>Type</th><th>Status</th><th>Attempts</th><th>Error</th><th>Created</th><th>Recovery</th></tr></thead><tbody>{snapshot.jobs.map((job) => <tr key={job.id}><td>{job.jobType}</td><td>{job.status}</td><td>{job.attempts}</td><td>{job.errorCode ?? "None"}</td><td>{job.createdAt}</td><td>{recoveryEnabled && job.status === "FAILED" ? <RecoveryActionControl targetId={job.id} /> : "Unavailable"}</td></tr>)}</tbody></table></div>
    <h2>Exports</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Export jobs"><table><thead><tr><th>Format</th><th>Scope</th><th>Status</th><th>Bytes</th><th>Created</th></tr></thead><tbody>{snapshot.exports.map((item) => <tr key={item.id}><td>{item.format}</td><td>{item.scope}</td><td>{item.status}</td><td>{item.sizeBytes ?? "Pending"}</td><td>{item.createdAt}</td></tr>)}</tbody></table></div>
    <h2>Snapshots</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Snapshot jobs"><table><thead><tr><th>Status</th><th>Bytes</th><th>Requested</th></tr></thead><tbody>{snapshot.snapshots.map((item) => <tr key={item.id}><td>{item.status}</td><td>{item.sizeBytes ?? "Pending"}</td><td>{item.createdAt}</td></tr>)}</tbody></table></div>
    <h2>Non-content audit</h2><ul>{snapshot.audits.map((audit) => <li key={audit.id}>{audit.kind} / {audit.targetType} / {audit.createdAt}</li>)}</ul>
    <h2>Operational events</h2><ul>{snapshot.operations.map((event, index) => <li key={`${event.eventName}-${event.occurredAt}-${index}`}>{event.eventName} / {event.occurredAt}</li>)}</ul>
  </section>;
}
