"use client";

import { useState } from "react";

type Envelope<T> = { data?: T; error?: { message: string } };
type Preview = { recoveryId: string; confirmationToken: string; expiresAt: string; requiredPhrase: "REQUEUE OUTBOX" };

export function RecoveryActionControl({ targetId }: { targetId: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [phrase, setPhrase] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestPreview = async () => {
    setBusy(true); setStatus(null);
    try {
      const response = await fetch("/api/v2/admin/recovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "PREVIEW", targetId }) });
      const envelope = await response.json() as Envelope<Preview>;
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Recovery preview failed.");
      setPreview(envelope.data);
      // Console trace S16-RECOVERY-003: admin recovery preview UI records stable identities and expiry; the confirmation token is excluded.
      console.log(JSON.stringify({ level: "info", step: "S16-RECOVERY-003", event: "operations.recovery_preview_displayed", targetId, recoveryId: envelope.data.recoveryId, expiresAt: envelope.data.expiresAt }));
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : "Recovery preview failed."); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    if (!preview) return;
    setBusy(true); setStatus(null);
    try {
      const response = await fetch("/api/v2/admin/recovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "CONFIRM", recoveryId: preview.recoveryId, targetId, confirmationToken: preview.confirmationToken, phrase }) });
      const envelope = await response.json() as Envelope<{ completed: boolean }>;
      if (!response.ok || !envelope.data?.completed) throw new Error(envelope.error?.message ?? "Recovery confirmation failed.");
      setPreview(null); setPhrase(""); setStatus("Outbox event requeued. Refresh to read its current state.");
      // Console trace S16-RECOVERY-004: admin recovery completion UI records stable identities and outcome; tokens and job payloads are excluded.
      console.log(JSON.stringify({ level: "info", step: "S16-RECOVERY-004", event: "operations.recovery_completed", targetId, recoveryId: preview.recoveryId, completed: true }));
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : "Recovery confirmation failed."); }
    finally { setBusy(false); }
  };
  if (!preview) return <div className="admin-recovery"><button type="button" disabled={busy} onClick={() => void requestPreview()}>Preview requeue</button>{status ? <p role="status">{status}</p> : null}</div>;
  return <div className="admin-recovery"><p>This action requeues one failed outbox event. It does not edit author content. Preview expires at <time dateTime={preview.expiresAt}>{preview.expiresAt}</time>.</p><label>Type {preview.requiredPhrase}<input value={phrase} onChange={(event) => setPhrase(event.target.value)} autoComplete="off" /></label><button type="button" disabled={busy || phrase !== preview.requiredPhrase} onClick={() => void confirm()}>Confirm requeue</button><button type="button" disabled={busy} onClick={() => { setPreview(null); setPhrase(""); }}>Cancel</button>{status ? <p role="status">{status}</p> : null}</div>;
}
